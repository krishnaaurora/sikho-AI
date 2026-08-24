import Groq from "groq-sdk";
import { config } from "../config";

const MODEL = "openai/gpt-oss-120b";

function getGroqClient(): Groq {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

export interface SkillItem {
  skill: string;
  level?: string; // "Beginner" | "Intermediate" | "Advanced" | "Expert"
  evidenceIn?: string; // e.g. "Projects, Experience"
}

export interface GapItem {
  skill: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  learnTime?: string; // e.g. "2-4 weeks"
}

export interface SkillGapResult {
  targetRole: string;
  existingSkills: SkillItem[];
  skillsToStrengthen: GapItem[];
  missingSkills: GapItem[];
  readinessScore: number; // 0-100, how ready for target role
  readinessSummary: string;
}

const SKILL_GAP_PROMPT = `You are a senior technical career coach. Analyze the resume and identify skill gaps for the candidate's target role.

Return ONLY valid JSON (no markdown, no extra text) matching this exact schema:
{
  "targetRole": "string",
  "existingSkills": [
    { "skill": "string", "level": "Beginner|Intermediate|Advanced|Expert", "evidenceIn": "string" }
  ],
  "skillsToStrengthen": [
    { "skill": "string", "priority": "High|Medium|Low", "reason": "string", "learnTime": "string" }
  ],
  "missingSkills": [
    { "skill": "string", "priority": "High|Medium|Low", "reason": "string", "learnTime": "string" }
  ],
  "readinessScore": number (0-100),
  "readinessSummary": "string (2-3 sentences)"
}

Rules:
- existingSkills: only skills clearly evidenced in the resume. Assess depth honestly.
- skillsToStrengthen: skills present in the resume but only surface-level for the target role.
- missingSkills: skills NOT in the resume but commonly required for the target role.
- readinessScore: honest 0-100 score for how ready the candidate is RIGHT NOW for the target role.
- Do NOT pad lists — be specific and concise.`;

export async function analyzeSkillGap(
  rawText: string,
  structuredData: Record<string, any>,
  targetRole: string
): Promise<SkillGapResult> {
  const groq = getGroqClient();

  const context = `
Target Role: ${targetRole}

Candidate Resume:
Skills listed: ${(structuredData.skills || []).join(", ")}
Experience: ${(structuredData.experience || [])
    .map((e: any) => `${e.role} at ${e.company}: ${e.description?.substring(0, 200)}`)
    .join("\n")}
Projects: ${(structuredData.projects || [])
    .map((p: any) => `${p.name} (${(p.technologies || []).join(", ")}): ${p.description?.substring(0, 150)}`)
    .join("\n")}
Internships: ${(structuredData.internships || [])
    .map((i: any) => `${i.role} at ${i.company}`)
    .join("; ")}
Certifications: ${(structuredData.certifications || [])
    .map((c: any) => c.name)
    .join(", ")}

Full text excerpt (first 5000 chars):
${rawText.substring(0, 5000)}
`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SKILL_GAP_PROMPT },
      { role: "user", content: context },
    ],
    temperature: 0.15,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(raw.trim());
    return {
      targetRole: parsed.targetRole || targetRole,
      existingSkills: parsed.existingSkills || [],
      skillsToStrengthen: parsed.skillsToStrengthen || [],
      missingSkills: parsed.missingSkills || [],
      readinessScore: Math.min(100, Math.max(0, parsed.readinessScore || 0)),
      readinessSummary: parsed.readinessSummary || "",
    };
  } catch (err: any) {
    console.error("[SkillGapService] JSON parse failed:", err.message);
    throw new Error("Failed to parse skill gap analysis response");
  }
}
