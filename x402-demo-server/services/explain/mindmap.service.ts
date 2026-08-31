import Groq from "groq-sdk";
import { config } from "../../config";

export interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

export interface MindMapResult {
  type: "mindmap";
  root: string;
  children: MindMapNode[];
}

/**
 * Generates a structured Mind Map representation using Groq JSON mode.
 */
export async function generateMindMapTree(
  topic: string,
  retrievedTextContext?: string
): Promise<MindMapResult> {
  const keys = config.groqApiKeys;
  if (!keys || keys.length === 0) throw new Error("No Groq API keys configured");
  
  // Use key slot 2 (Model visual flow / large structured)
  const client = new Groq({ apiKey: keys[2 % keys.length] });

  const systemPrompt = `You are a visual mapping specialist. Build a highly detailed, hierarchical Mind Map in JSON format for the topic.
Keep concepts organized, concise, and structured. Use simple English names.
${retrievedTextContext ? `\nGround your mind map branches on these verified source facts:\n${retrievedTextContext}` : ""}

Return ONLY a valid JSON object matching this structure:
{
  "type": "mindmap",
  "root": "${topic}",
  "children": [
    {
      "name": "Branch Name 1",
      "children": [
        { "name": "Sub-concept A" },
        { "name": "Sub-concept B" }
      ]
    },
    {
      "name": "Branch Name 2",
      "children": [
        { "name": "Sub-concept C" }
      ]
    }
  ]
}`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a mind map hierarchy tree for "${topic}"` }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq Mindmap Agent");
    const parsed = JSON.parse(content);
    
    return {
      type: "mindmap",
      root: parsed.root || topic,
      children: parsed.children || []
    };
  } catch (err: any) {
    console.error("[Mindmap Service Error]:", err);
    // Simple fallback Mindmap
    return {
      type: "mindmap",
      root: topic,
      children: [
        {
          name: "Core Concepts",
          children: [
            { name: "Overview & Definitions" },
            { name: "Fundamental Mechanisms" }
          ]
        },
        {
          name: "Applications",
          children: [
            { name: "Production Case Studies" },
            { name: "Scalability Options" }
          ]
        }
      ]
    };
  }
}
