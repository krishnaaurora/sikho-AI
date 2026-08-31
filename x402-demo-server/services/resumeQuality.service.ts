import { resumeGroqJson } from "./resumeGroq.service";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
export type CheckStatus = "Excellent" | "Good" | "Needs Work" | "Missing";
export type IssuePriority = "High" | "Medium" | "Low";

export interface QualityCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ResumeIssue {
  id: string;
  title: string;
  category: string;
  priority: IssuePriority;
  description: string;
}

export interface QualityAnalysis {
  overallScore: number;      // 0-100
  atsScore: number;          // 0-100
  impactScore: number;       // 0-100
  projectScore: number;      // 0-100
  experienceScore: number;   // 0-100
  careerAlignmentScore: number; // 0-100
  checks: QualityCheck[];
  issues: ResumeIssue[];
  tip: string;
}

// ─────────────────────────────────────────────────────────────────
// GROQ PROMPT
// ─────────────────────────────────────────────────────────────────
const QUALITY_PROMPT = `You are an expert resume quality analyst and ATS specialist. Analyze the resume and return a comprehensive quality report as valid JSON.

Return ONLY valid JSON, no markdown, no extra text.

Schema:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "impactScore": number (0-100, based on measurable impact & strong action verbs),
  "projectScore": number (0-100, based on project quality and descriptions),
  "experienceScore": number (0-100, based on experience descriptions quality),
  "careerAlignmentScore": number (0-100, based on career path consistency),
  "tip": "string (one concise motivational tip to improve the resume)",
  "checks": [
    {
      "key": "string (camelCase identifier)",
      "label": "string (human readable label)",
      "status": "Excellent" | "Good" | "Needs Work" | "Missing",
      "detail": "string (brief explanation of the check result)"
    }
  ],
  "issues": [
    {
      "id": "string (unique id like issue_1)",
      "title": "string (concise issue title)",
      "category": "string (e.g. Impact, Missing Section, Content Quality, Keyword Usage, Formatting)",
      "priority": "High" | "Medium" | "Low",
      "description": "string (actionable description of the issue)"
    }
  ]
}

Required checks (in this order):
1. atsCompatibility — Is the resume ATS-friendly? (no tables, no images, standard headers)
2. missingSections — Are all key sections present? (contact, summary, experience, education, skills)
3. weakBulletPoints — Are bullet points strong? (action verbs, specific outcomes)
4. genericDescriptions — Are descriptions specific or generic?
5. repeatedKeywords — Are there overused keywords?
6. missingMeasurableImpact — Do bullets have numbers/metrics/impact?
7. poorFormatting — Is the formatting clean and consistent?
8. skillProjectConsistency — Do skills align with project technologies?
9. experienceDescriptions — Are experience descriptions detailed enough?
10. projectQuality — Are projects well-described with tech and impact?
11. careerAlignment — Is there a clear career direction?

Find 5-8 specific, actionable issues. Each must be unique and targeted.`;

// ─────────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────────
export async function analyzeResumeQuality(
  rawText: string,
  structuredData: Record<string, any>
): Promise<QualityAnalysis> {
  const resumeContext = `
RAW TEXT (first 8000 chars):
${rawText.substring(0, 8000)}

STRUCTURED DATA SUMMARY:
- Name: ${structuredData.personal?.name || "Unknown"}
- Skills: ${(structuredData.skills || []).slice(0, 20).join(", ")}
- Experience entries: ${(structuredData.experience || []).length}
- Projects: ${(structuredData.projects || []).length}
- Education: ${(structuredData.education || []).length}
- Certifications: ${(structuredData.certifications || []).length}
- Has Summary: ${!!structuredData.personal?.summary}
`;

  const result = await resumeGroqJson<QualityAnalysis>({
    system: QUALITY_PROMPT,
    user: `Analyze this resume:\n${resumeContext}`,
    maxTokens: 3000,
    temperature: 0.2,
  });

  try {
    // Safety clamp all scores
    result.overallScore = Math.min(100, Math.max(0, result.overallScore || 0));
    result.atsScore = Math.min(100, Math.max(0, result.atsScore || 0));
    result.impactScore = Math.min(100, Math.max(0, result.impactScore || 0));
    result.projectScore = Math.min(100, Math.max(0, result.projectScore || 0));
    result.experienceScore = Math.min(100, Math.max(0, result.experienceScore || 0));
    result.careerAlignmentScore = Math.min(100, Math.max(0, result.careerAlignmentScore || 0));
    return result;
  } catch (err: any) {
    console.error("[QualityService] JSON parse failed:", err.message);
    throw new Error(`Failed to parse resume quality analysis response: ${err.message}`);
  }
}
