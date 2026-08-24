import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testGroq() {
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  if (!keys.length) {
    console.error("No API keys found");
    return;
  }

  const client = new Groq({ apiKey: keys[0] });
  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: "Hello, reply with only one word 'success'." }],
      model: "openai/gpt-oss-120b",
      max_tokens: 10,
    });
    console.log("Full response:", JSON.stringify(completion, null, 2));
  } catch (err: any) {
    console.error("Error:", err);
  }
}

testGroq();
