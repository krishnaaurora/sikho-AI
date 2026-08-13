import fs from "fs";
import path from "path";
import { URL } from "url";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

export interface ExtractedDoc {
  name: string;
  sizeBytes: number;
  pageCount: number;
  chunks: {
    id: string;
    text: string;
    pageNumber: number;
    heading?: string;
  }[];
}

/**
 * Validates a URL to prevent SSRF (Server-Side Request Forgery)
 * and verifies it is HTTP/HTTPS.
 */
export function validateUrl(targetUrl: string): string {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new AppError("Invalid protocol. Only http and https are allowed.", 400);
    }
    const host = parsed.hostname.toLowerCase();
    
    // SSRF Prevention checks
    const ssrfHosts = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254", // AWS Metadata
      "::1"
    ];
    if (
      ssrfHosts.includes(host) ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.17.") ||
      host.startsWith("172.18.") ||
      host.startsWith("172.19.") ||
      host.startsWith("172.20.") ||
      host.startsWith("172.31.")
    ) {
      throw new AppError("Access to internal/private network addresses is blocked.", 403);
    }
    return parsed.toString();
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError("Malformed URL structure.", 400);
  }
}

/**
 * Extracts and chunks document text. 
 * Real PDF text extraction can be done via pdf-parse, but for now we extract
 * lines cleanly and build chunk boundaries to avoid third-party dependencies breaking.
 */
export async function processPDF(filePath: string, originalName: string): Promise<ExtractedDoc> {
  if (!fs.existsSync(filePath)) {
    throw new AppError("Uploaded file does not exist on disk", 404);
  }

  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);
  
  // Basic text extraction from buffer (supporting plain text/ascii-printable segments)
  let rawText = "";
  try {
    rawText = buffer.toString("utf8");
    // Strip non-printable binary parts
    rawText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ");
  } catch (_) {
    rawText = "Document could not be processed as pure text.";
  }

  // Chunk text into sentences/paragraphs (approx 500 characters per chunk)
  const paragraphLimit = 800;
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 10);
  
  const chunks: ExtractedDoc["chunks"] = [];
  let pageNumber = 1;
  let chunkCount = 0;

  paragraphs.forEach((p, idx) => {
    // Increment page approx every 4 paragraphs for simulation
    if (idx > 0 && idx % 4 === 0) pageNumber++;
    
    // Chunk split if paragraph exceeds limit
    const cleanText = p.replace(/\s+/g, " ").trim();
    if (cleanText.length > paragraphLimit) {
      const segments = cleanText.match(new RegExp(`.{1,${paragraphLimit}}`, "g")) || [];
      segments.forEach((seg, sIdx) => {
        chunkCount++;
        chunks.push({
          id: `chunk-${chunkCount}-${Date.now()}`,
          text: seg,
          pageNumber,
          heading: sIdx === 0 ? cleanText.substring(0, 40) + "..." : undefined
        });
      });
    } else {
      chunkCount++;
      chunks.push({
        id: `chunk-${chunkCount}-${Date.now()}`,
        text: cleanText,
        pageNumber,
        heading: cleanText.substring(0, 40) + "..."
      });
    }
  });

  return {
    name: originalName,
    sizeBytes: stat.size,
    pageCount: pageNumber,
    chunks
  };
}

/**
 * Fetches HTML from a target URL, extracts core body text, and chunk it.
 */
export async function processURL(targetUrl: string): Promise<ExtractedDoc> {
  const verifiedUrl = validateUrl(targetUrl);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(verifiedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SikhoAI-Learning-Bot/1.0",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new AppError(`Failed to fetch website: HTTP ${response.status}`, 400);
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(verifiedUrl).hostname;

    // Clean HTML content (stripping tags, scripts, navigation block noise)
    let bodyText = html;
    bodyText = bodyText.replace(/<script[\s\S]*?<\/script>/gi, "");
    bodyText = bodyText.replace(/<style[\s\S]*?<\/style>/gi, "");
    bodyText = bodyText.replace(/<nav[\s\S]*?<\/nav>/gi, "");
    bodyText = bodyText.replace(/<header[\s\S]*?<\/header>/gi, "");
    bodyText = bodyText.replace(/<footer[\s\S]*?<\/footer>/gi, "");
    bodyText = bodyText.replace(/<[^>]+>/g, " "); // Strip remaining tags
    bodyText = bodyText.replace(/&nbsp;/g, " ");
    bodyText = bodyText.replace(/\s+/g, " ").trim();

    if (bodyText.length < 50) {
      throw new AppError("The target URL does not contain enough extractable text content.", 400);
    }

    // Split text into chunks
    const chunkLimit = 800;
    const regex = new RegExp(`.{1,${chunkLimit}}`, "g");
    const segments = bodyText.match(regex) || [];

    const chunks = segments.map((seg, idx) => ({
      id: `url-chunk-${idx}-${Date.now()}`,
      text: seg.trim(),
      pageNumber: 1,
      heading: idx === 0 ? title : `Section ${idx + 1}`
    }));

    return {
      name: title,
      sizeBytes: Buffer.byteLength(html),
      pageCount: 1,
      chunks
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    logger.error("URL Ingestion Error:", err);
    throw new AppError(err?.name === "AbortError" ? "Fetch timeout. Host did not respond within 8 seconds." : "Unable to parse target webpage.", 500);
  }
}
