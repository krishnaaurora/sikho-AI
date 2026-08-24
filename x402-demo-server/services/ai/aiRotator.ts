import Groq from "groq-sdk";
import { config } from "../../config";

// Setup single rotated client request helper
const keys = config.groqApiKeys;
if (!keys || keys.length === 0) {
  throw new Error("No Groq API keys configured in .env");
}
const clientPool = keys.map(k => new Groq({ apiKey: k }));
let keyRotatorIndex = 0;

export async function queryAIWithJsonRotation(systemPrompt: string, userPrompt: string): Promise<any> {
  const attempts = clientPool.length;
  for (let i = 0; i < attempts; i++) {
    const activeIndex = (keyRotatorIndex + i) % clientPool.length;
    const client = clientPool[activeIndex];
    try {
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      keyRotatorIndex = (activeIndex + 1) % clientPool.length;
      return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (err) {
      console.error(`[Groq Rotation] Key slot ${activeIndex} failed:`, err);
      if (i === attempts - 1) {
        throw new Error("All Groq key client rotation attempts failed.");
      }
    }
  }
}
