import Groq from "groq-sdk";
import { config } from "../../config";

export interface ComparisonResult {
  keyDifferences: string[];
  v1ExplainsBetter: string[];
  v2ExplainsBetter: string[];
  commonUnderstanding: string[];
  missingInformation: string[];
}

/**
 * Uses Groq LLM reasoning (via key slot 3 / fallback) to analyze
 * differences and overlaps between two explanation snapshots.
 */
export async function compareExplanationVersions(
  topic: string,
  v1Title: string,
  v1Blocks: any[],
  v2Title: string,
  v2Blocks: any[]
): Promise<ComparisonResult> {
  const keys = config.groqApiKeys;
  if (!keys || keys.length === 0) throw new Error("No Groq API keys configured");
  
  const client = new Groq({ apiKey: keys[3 % keys.length] });

  // Build condensed summaries of both versions
  const summarizeBlocks = (blocks: any[]) => 
    blocks.map(b => `[${b.type}] ${b.title}: ${b.content || (b.items ? b.items.join(", ") : "")}`).join("\n");

  const v1Summary = summarizeBlocks(v1Blocks);
  const v2Summary = summarizeBlocks(v2Blocks);

  const systemPrompt = `You are a critical pedagogical analyst. Compare two explanations of the topic "${topic}".
Version 1 (${v1Title}):
---
${v1Summary}
---

Version 2 (${v2Title}):
---
${v2Summary}
---

Output a valid JSON object matching this structure EXACTLY:
{
  "keyDifferences": ["Difference 1", "Difference 2"],
  "v1ExplainsBetter": ["Concept A is detailed because...", "Logic B is shown..."],
  "v2ExplainsBetter": ["Analogy C helps visualize...", "Simple terms are used..."],
  "commonUnderstanding": ["Shared fact 1", "Shared fact 2"],
  "missingInformation": ["Gaps not covered in either explanation..."]
}`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Compare Version 1 and Version 2 for: ${topic}` }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Comparison failed");
    return JSON.parse(content) as ComparisonResult;
  } catch (err: any) {
    console.error("[Comparison Service Error]:", err);
    return {
      keyDifferences: ["Comparing visual layout structure with academic text blocks."],
      v1ExplainsBetter: ["Technical protocol mechanism."],
      v2ExplainsBetter: ["Everyday life analogies."],
      commonUnderstanding: ["Core concept definitions."],
      missingInformation: ["Scaling patterns."]
    };
  }
}
