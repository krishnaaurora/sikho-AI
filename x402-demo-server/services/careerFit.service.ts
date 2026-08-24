import { resumeGroqJson } from "./resumeGroq.service";

export interface CareerFitRole {
  role: string;
  confidence: number; // 0-100
  reasons: string[];
}

export interface CareerFitResult {
  topRoles: CareerFitRole[];
  summary: string;
  primaryCareer: string;
}

const CAREER_FIT_PROMPT = `You are an expert career analyst. Based on the resume below, determine what job roles this candidate naturally fits.

Return ONLY valid JSON (no markdown, no extra text) matching this exact schema:
{
  "topRoles": [
    {
      "role": "string (job title)",
      "confidence": number (0-100),
      "reasons": ["string", "string"]
    }
  ],
  "summary": "string (2-sentence career fit summary)",
  "primaryCareer": "string (single best-fit role title)"
}

Rules:
- Return exactly 5 roles ordered by confidence descending.
- confidence must reflect how well the resume skills/experience align with that role.
- reasons must be specific to the resume content (cite actual skills/projects/companies).
- Do NOT invent roles not supported by the resume.`;

export async function analyzeCareerFit(
  rawText: string,
  structuredData: Record<string, any>
): Promise<CareerFitResult> {
  const context = `
Name: ${structuredData.personal?.name || "Candidate"}
Skills: ${(structuredData.skills || []).join(", ")}
Experience: ${(structuredData.experience || [])
    .map((e: any) => `${e.role} at ${e.company}`)
    .join("; ")}
Projects: ${(structuredData.projects || [])
    .map((p: any) => p.name)
    .join(", ")}
Education: ${(structuredData.education || [])
    .map((e: any) => `${e.degree} in ${e.field} from ${e.institution}`)
    .join("; ")}
Certifications: ${(structuredData.certifications || [])
    .map((c: any) => c.name)
    .join(", ")}

Resume text (first 6000 chars):
${rawText.substring(0, 6000)}
`;

  const parsed = await resumeGroqJson<any>({
    system: CAREER_FIT_PROMPT,
    user: `Analyze career fit for this resume:\n${context}`,
    maxTokens: 1500,
    temperature: 0.15,
  });

  try {
    // Normalise
    return {
      topRoles: (parsed.topRoles || []).map((r: any) => ({
        role: r.role || "Unknown",
        confidence: Math.min(100, Math.max(0, r.confidence || 0)),
        reasons: r.reasons || [],
      })),
      summary: parsed.summary || "",
      primaryCareer: parsed.primaryCareer || parsed.topRoles?.[0]?.role || "Software Engineer",
    };
  } catch (err: any) {
    console.error("[CareerFitService] JSON parse failed:", err.message);
    throw new Error("Failed to parse career fit analysis response");
  }
}
