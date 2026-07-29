import Groq from "groq-sdk";
import { config } from "../../config";

// Initialize Groq client with API key rotation
let currentKeyIndex = 0;
let groqClient: Groq;

const initGroqClient = () => {
  if (config.groqApiKeys && config.groqApiKeys.length > 0) {
    const apiKey = config.groqApiKeys[currentKeyIndex];
    groqClient = new Groq({ apiKey });
  } else {
    throw new Error("No Groq API keys configured");
  }
};

initGroqClient();

// Helper to rotate keys on error
const rotateKey = () => {
  if (config.groqApiKeys && config.groqApiKeys.length > 0) {
    currentKeyIndex = (currentKeyIndex + 1) % config.groqApiKeys.length;
    initGroqClient();
  }
};

// Interface for generated chapter
export interface GeneratedChapter {
  title: string;
  description: string;
  lessons: { title: string; content: string }[];
  price: number;
}

// Interface for generated course structure
export interface GeneratedCourse {
  courseDescription: string;
  chapters: GeneratedChapter[];
}

// Generate course chapters using AI
export const generateCourseChapters = async (
  topic: string,
  numberOfChapters = 15
): Promise<GeneratedCourse> => {
  const systemPrompt = `You are an expert curriculum designer specializing in creating comprehensive educational courses on any topic.
Your task is to generate a structured course outline with chapters and lessons for the given topic.

Requirements:
1. Create a logical, progressive curriculum that builds from basics to advanced concepts
2. Each chapter should have a clear, specific title that focuses on one key concept
3. Each chapter should have a brief, informative description
4. Each chapter should have 3-8 specific, actionable lessons. Each lesson MUST include a detailed "content" field (2-3 paragraphs) that explains the core concepts of that lesson in depth.
5. Chapters should increase in difficulty and complexity
6. Price each chapter appropriately (start low, increase slightly with each chapter)
7. Output only JSON in the following format, no extra text:
{
  "courseDescription": "Brief, engaging course overview",
  "chapters": [
    {
      "title": "Chapter specific title",
      "description": "Brief chapter description",
      "lessons": [
        {
          "title": "Lesson 1 title",
          "content": "Detailed educational content for Lesson 1 (2-3 paragraphs)..."
        }
      ],
      "price": 0.5
    }
  ]
}`;

  const userPrompt = `Create a comprehensive course on "${topic}" with ${numberOfChapters} chapters.`;

  let retries = 0;
  const maxRetries = config.groqApiKeys ? config.groqApiKeys.length : 1;

  while (retries < maxRetries) {
    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent as GeneratedCourse;
    } catch (error: any) {
      console.error("AI generation error:", error);
      retries++;
      if (retries < maxRetries) {
        rotateKey();
        console.log(`Rotated API key, retrying (${retries}/${maxRetries})...`);
      } else {
        throw new Error("Failed to generate course chapters after multiple attempts");
      }
    }
  }

  throw new Error("Failed to generate course chapters");
};
