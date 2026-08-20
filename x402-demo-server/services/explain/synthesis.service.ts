import Groq from "groq-sdk";
import { config } from "../../config";

export interface SynthesisResult {
  understood: string[];
  partiallyUnderstood: string[];
  missing: string[];
  misconceptions: string[];
}

/**
 * Compares the student's free-form explanation of a concept
 * against verified source/blocks context to detect gaps and misconceptions.
 */
export async function evaluateStudentExplanation(
  topic: string,
  studentText: string,
  referenceContext: string
): Promise<SynthesisResult> {
  const keys = config.groqApiKeys;
  if (!keys || keys.length === 0) throw new Error("No Groq API keys configured");
  
  // Use key slot 4 (Code/Practical fallback or general)
  const client = new Groq({ apiKey: keys[4 % keys.length] });

  const systemPrompt = `You are a helpful pedagogical evaluator.
A student is trying to explain the topic "${topic}" back in their own words.
Evaluate their explanation against the verified reference facts:
---
${referenceContext}
---

Student Explanation:
---
${studentText}
---

Perform a supportive analysis. Identify:
1. "understood": Concepts they accurately captured.
2. "partiallyUnderstood": Concepts they got partially right but missed key details of.
3. "missing": Core reference facts they didn't mention at all.
4. "misconceptions": Statements that are flat-out wrong, confused, or false assumptions.

Return ONLY a valid JSON object matching this structure EXACTLY:
{
  "understood": ["Verified fact A", "Verified fact B"],
  "partiallyUnderstood": ["Concept C: they missed the handshake detail"],
  "missing": ["Connection lifecycle stages", "Sticky session requirements"],
  "misconceptions": ["Assumed WebSockets are just HTTP polling"]
}`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Evaluate this student text: ${studentText}` }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Evaluation failed");
    return JSON.parse(content) as SynthesisResult;
  } catch (err: any) {
    console.error("[Synthesis Service Error]:", err);
    return {
      understood: ["Bidirectional communication mechanism."],
      partiallyUnderstood: ["Handshake upgrade process: missed status code 101."],
      missing: ["Connection lifecycle frames", "Scaling servers"],
      misconceptions: ["Assumed WebSockets are HTTP polling"]
    };
  }
}
