import path from "path";
import fs from "fs";
import Groq from "groq-sdk";
import { config } from "../config";

// --- PDF Parser ---
const getPdfParse = async (): Promise<(buffer: Buffer) => Promise<{ text: string }>> => {
  // pdf-parse is CJS; use require for reliable loading
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("pdf-parse");
  return typeof mod === "function" ? mod : mod.default ?? mod;
};

// --- DOCX Parser (lazy-loaded) ---
let mammoth: any = null;
const getMammoth = async () => {
  if (!mammoth) {
    mammoth = await import("mammoth");
  }
  return mammoth;
};

// --- Groq client with round-robin key rotation ---
const getGroqClient = (): Groq => {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
};

// ─────────────────────────────────────────────────────────────────
// 1. EXTRACT RAW TEXT FROM FILE
// ─────────────────────────────────────────────────────────────────
export async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    const parse = await getPdfParse();
    const result = await parse(buffer);
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
      "endYear": string",
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
- Separate work experience from internships if possible.
- Extract ALL skills mentioned anywhere in the resume.
- Keep descriptions concise but complete.
- Extract all links (GitHub, LinkedIn, portfolio, etc.).`;

export async function extractStructuredData(rawText: string): Promise<Record<string, any>> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Extract information from this resume:\n\n${rawText.substring(0, 12000)}`
      }
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content || "{}";

  // Strip markdown code blocks if present
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("[ExtractionService] JSON parse failed, returning empty structure");
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
