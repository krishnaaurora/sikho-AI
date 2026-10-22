import Groq from "groq-sdk";
import { config } from "../../config";

// Collect all active, non-empty Groq API keys from existing environment variables
const rawKeys: (string | undefined)[] = [
  ...(config.groqApiKeys || []),
  ...(config.groqResumeKeys || []),
  ...(config.groqInterviewPrepKeys || []),
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_RESUME_KEY_1,
];

const validKeys: string[] = Array.from(
  new Set(
    rawKeys.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
  )
);

if (validKeys.length === 0) {
  console.warn("[aiRotator] Warning: No active Groq API keys found in environment variables.");
}

const clientPool: Groq[] = validKeys.map(k => new Groq({ apiKey: k }));
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

// Setup Interview Prep rotator
const rawInterviewKeys = [
  ...(config.groqInterviewPrepKeys || []),
  process.env.GROQ_INTERVIEW_PREP_KEY_1,
  process.env.GROQ_INTERVIEW_PREP_KEY_2,
];
const validInterviewKeys = Array.from(
  new Set(
    rawInterviewKeys.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
  )
);
const interviewPrepClientPool = validInterviewKeys.length > 0
  ? validInterviewKeys.map(k => new Groq({ apiKey: k }))
  : clientPool; // fallback to generic pool if not configured
let interviewPrepKeyRotatorIndex = 0;

export async function queryInterviewPrepWithJsonRotation(systemPrompt: string, userPrompt: string): Promise<any> {
  const attempts = interviewPrepClientPool.length;
  for (let i = 0; i < attempts; i++) {
    const activeIndex = (interviewPrepKeyRotatorIndex + i) % interviewPrepClientPool.length;
    const client = interviewPrepClientPool[activeIndex];
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
      interviewPrepKeyRotatorIndex = (activeIndex + 1) % interviewPrepClientPool.length;
      return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (err) {
      console.error(`[Groq Interview Prep Rotation] Key slot ${activeIndex} failed:`, err);
      if (i === attempts - 1) {
        throw new Error("All Groq interview prep key client rotation attempts failed.");
      }
    }
  }
}
