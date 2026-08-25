import path from "path";
import fs from "fs";
import axios from "axios";
import Groq from "groq-sdk";
import { config } from "../config";
import { resumeGroqJson } from "./resumeGroq.service";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// --- DOCX Parser (lazy-loaded) ---
let mammoth: any = null;
const getMammoth = async () => {
  if (!mammoth) {
    mammoth = await import("mammoth");
  }
  return mammoth;
};

// --- Groq client for legacy callers (kept for non-resume use) ---

// ─────────────────────────────────────────────────────────────────
// 1. EXTRACT RAW TEXT FROM FILE
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// 0. DETECT IF THE DOCUMENT IS ACTUALLY A RESUME
// ─────────────────────────────────────────────────────────────────
export interface DocumentTypeResult {
  isResume: boolean;
  documentType: string; // "resume" | "legal_document" | "registration_form" | "invoice" | "academic_paper" | "other"
  confidence: number;   // 0-100
  reason: string;
}

export async function detectDocumentType(rawText: string): Promise<DocumentTypeResult> {
  const geminiKey = (config as any).geminiApiKey;
  const sample = rawText.substring(0, 3000);

  const prompt = `You are a document classifier. Determine if the following document is a RESUME/CV or something else entirely.

A resume typically contains: candidate name, contact info, work experience or internships, education, skills, and/or projects.

Return ONLY valid JSON (no markdown):
{
  "isResume": boolean,
  "documentType": "resume" | "legal_document" | "registration_form" | "invoice" | "academic_paper" | "medical_record" | "other",
  "confidence": number (0-100),
  "reason": "one sentence explaining your classification"
}

Document text (first 3000 chars):
${sample}`;

  // Try Gemini first (fast + cheap for classification)
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(`[DocTypeDetect] Gemini classified as: ${parsed.documentType} (isResume=${parsed.isResume}, confidence=${parsed.confidence})`);
        return parsed as DocumentTypeResult;
      }
    } catch (err: any) {
      console.warn(`[DocTypeDetect] Gemini classification failed: ${err.message}`);
    }
  }

  // Fallback: heuristic keyword check
  const lowerText = rawText.toLowerCase().substring(0, 5000);
  const resumeKeywords = ["experience", "education", "skills", "resume", "curriculum vitae", "cv", "internship", "work history", "employment"];
  const nonResumeKeywords = ["registration form", "hereby declare", "agreement", "contract", "invoice", "patient", "prescription", "affidavit", "terms and conditions"];

  const resumeHits = resumeKeywords.filter(k => lowerText.includes(k)).length;
  const nonResumeHits = nonResumeKeywords.filter(k => lowerText.includes(k)).length;

  const isResume = resumeHits >= 3 && nonResumeHits === 0;
  return {
    isResume,
    documentType: isResume ? "resume" : "other",
    confidence: isResume ? 60 : 70,
    reason: isResume
      ? `Heuristic: found ${resumeHits} resume keywords`
      : `Heuristic: found ${nonResumeHits} non-resume indicators, only ${resumeHits} resume keywords`,
  };
}

export async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  // Try parsing using IBM Docling (python helper script) first.
  // Hard-cap at 5 s — Docling cold-starts a heavy ML model and can hang
  // for 10-30 s on the first call. If it doesn't finish quickly, we fall
  // through to the fast Node.js parsers below.
  try {
    const scriptPath = path.join(__dirname, "../scripts/extract_docling.py");
    const { stdout } = await execAsync(
      `python "${scriptPath}" "${filePath}"`,
      { timeout: 5000 }   // kill after 5 s
    );
    if (stdout && stdout.trim().length > 0) {
      console.log(`[Docling] Successfully extracted ${stdout.length} characters`);
      return stdout;
    }
  } catch (err: any) {
    console.warn(`[Docling] Failed or timed out, falling back to local Node parsers. Error:`, err.message || err);
  }

  // Fallback to traditional parser if Docling fails or is not available
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParseMod = require("pdf-parse");
    
    // Check if it's the new class-based TypeScript version
    if (pdfParseMod.PDFParse) {
      const parser = new pdfParseMod.PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        return textResult.text || "";
      } finally {
        await parser.destroy().catch(() => {});
      }
    }
    
    // Fallback to the old CJS function version
    const parseFunc = typeof pdfParseMod === "function" ? pdfParseMod : pdfParseMod.default ?? pdfParseMod;
    if (typeof parseFunc !== "function") {
      throw new Error("Could not load a valid pdf-parse function or class");
    }
    const result = await parseFunc(buffer);
    return result.text || "";
  }

  if (ext === ".doc" || ext === ".docx") {
    const mam = await getMammoth();
    const result = await mam.extractRawText({ buffer });
    return result.value || "";
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ─────────────────────────────────────────────────────────────────
// 2. GROQ STRUCTURED EXTRACTION
// ─────────────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are an expert resume parser. Extract ALL information from the resume text into a structured JSON object.

Return ONLY valid JSON, no markdown, no extra text.

Schema:
{
  "personal": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "github": "string",
    "linkedin": "string",
    "website": "string",
    "summary": "string (professional summary / objective)"
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startYear": "string",
      "endYear": "string",
      "gpa": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "internships": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "achievements": ["string"],
  "publications": ["string"],
  "links": ["string"]
}

Rules:
- If a field is not found, use empty string "" or empty array [].
- CRITICAL: The "experience" array must include ALL work-like entries regardless of how the section is labelled in the resume. Treat any of these section headings as experience: "Experience", "Work Experience", "Professional Experience", "Job Experience", "Internship Experience", "Internships", "Industry Experience", "Relevant Experience", "Career History", "Employment History", "Work History". Do NOT leave experience empty just because the section has an unusual name.
- Only use the separate "internships" array for entries you cannot classify as either formal work or part-time work — when in doubt, put the entry in "experience".
- Extract ALL skills mentioned anywhere in the resume.
- Keep descriptions concise but complete.
- Extract all links (GitHub, LinkedIn, portfolio, etc.).`;

export async function extractStructuredData(rawText: string): Promise<Record<string, any>> {
  const geminiKey = (config as any).geminiApiKey;
  if (geminiKey) {
    try {
      console.log(`[ExtractionService] Trying structured extraction via Gemini API`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: `${EXTRACTION_PROMPT}\n\nExtract information from this resume:\n\n${rawText.substring(0, 15000)}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const cleaned = content
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        console.log(`[ExtractionService] ✓ Successfully parsed structured data using Gemini`);
        return parsed;
      }
    } catch (geminiError: any) {
      console.warn(`[ExtractionService] Gemini extraction failed, falling back to Groq. Error:`, geminiError.message || geminiError);
    }
  }

  console.log(`[ExtractionService] Running structured extraction via Groq Resume pool`);

  try {
    return await resumeGroqJson({
      system: EXTRACTION_PROMPT,
      user: `Extract information from this resume:\n\n${rawText.substring(0, 12000)}`,
      temperature: 0.1,
      maxTokens: 4096,
    });
  } catch {
    console.error("[ExtractionService] Groq extraction failed, returning empty structure");
    return {
      personal: {}, education: [], experience: [], internships: [],
      skills: [], projects: [], certifications: [], achievements: [],
      publications: [], links: []
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. COMPUTE SECTION STATUSES
// ─────────────────────────────────────────────────────────────────
export interface SectionStatus {
  key: string;
  label: string;
  status: "extracted" | "empty";
  count: number;
}

export function computeSectionStatuses(structured: Record<string, any>): SectionStatus[] {
  const p = structured.personal || {};
  const personalFields = ["name", "email", "phone", "location", "github", "linkedin", "summary"];
  const personalCount = personalFields.filter(f => p[f]).length;

  return [
    { key: "personal",       label: "Personal Information",   status: personalCount > 0 ? "extracted" : "empty",                                     count: personalCount },
    { key: "summary",        label: "Professional Summary",   status: p.summary ? "extracted" : "empty",                                             count: p.summary ? 1 : 0 },
    { key: "experience",     label: "Experience",             status: (structured.experience?.length || 0) > 0 ? "extracted" : "empty",              count: structured.experience?.length || 0 },
    { key: "education",      label: "Education",              status: (structured.education?.length || 0) > 0 ? "extracted" : "empty",               count: structured.education?.length || 0 },
    { key: "skills",         label: "Skills",                 status: (structured.skills?.length || 0) > 0 ? "extracted" : "empty",                  count: structured.skills?.length || 0 },
    { key: "projects",       label: "Projects",               status: (structured.projects?.length || 0) > 0 ? "extracted" : "empty",                count: structured.projects?.length || 0 },
    { key: "certifications", label: "Certifications",         status: (structured.certifications?.length || 0) > 0 ? "extracted" : "empty",          count: structured.certifications?.length || 0 },
    { key: "achievements",   label: "Achievements",           status: (structured.achievements?.length || 0) > 0 ? "extracted" : "empty",            count: structured.achievements?.length || 0 },
    { key: "publications",   label: "Publications",           status: (structured.publications?.length || 0) > 0 ? "extracted" : "empty",            count: structured.publications?.length || 0 },
    { key: "internships",    label: "Internships",            status: (structured.internships?.length || 0) > 0 ? "extracted" : "empty",             count: structured.internships?.length || 0 },
  ];
}
