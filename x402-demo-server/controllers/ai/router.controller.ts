import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { queryAIWithJsonRotation } from "../../services/ai/aiRotator";

// Rules for obvious deterministic cases
function getDeterministicIntent(input: string): { intent: string; confidence: number; action: string; endpoint: string; requiresClarification: boolean; reason: string; topic?: string } | null {
  const clean = input.trim().toLowerCase();

  // 1. COURSE_REQUEST obvious matches
  if (
    clean.startsWith("study ") ||
    clean.startsWith("learn ") && (clean.endsWith(" from scratch") || clean.includes(" scratch")) ||
    clean.startsWith("master ") ||
    clean.startsWith("create course ") ||
    clean.startsWith("complete course ") ||
    clean.startsWith("structured learning ") ||
    clean.includes("curriculum") ||
    clean.includes("roadmap for learning") ||
    clean.includes("beginner to advanced") ||
    clean.includes("step-by-step learning") ||
    clean.includes("comprehensive learning") ||
    clean.includes("learn over multiple sessions")
  ) {
    // Extract topic
    let topic = input;
    if (clean.startsWith("study ")) topic = input.slice(6);
    else if (clean.startsWith("master ")) topic = input.slice(7);
    else if (clean.startsWith("create course ")) topic = input.slice(14);
    else if (clean.startsWith("complete course on ")) topic = input.slice(19);
    else if (clean.startsWith("complete course ")) topic = input.slice(16);

    return {
      intent: "COURSE_REQUEST",
      confidence: 0.98,
      topic: topic.trim().replace(/^on\s+/i, ""),
      action: "generate-course",
      endpoint: "/api/v1/ai/generate-course",
      requiresClarification: false,
      reason: "Explicit structured course query matched"
    };
  }

  // 2. CONCEPT_EXPLANATION obvious matches
  if (
    clean.startsWith("what is ") ||
    clean.startsWith("explain ") ||
    clean.startsWith("how does ") && clean.endsWith(" work") ||
    clean.startsWith("why does ") && clean.endsWith(" happen") ||
    clean.endsWith(" simply") ||
    clean.includes("give me an overview") ||
    clean.includes("i need to understand") ||
    clean.includes("explain this concept")
  ) {
    let topic = input;
    if (clean.startsWith("what is ")) topic = input.slice(8);
    else if (clean.startsWith("explain ")) topic = input.slice(8);

    return {
      intent: "CONCEPT_EXPLANATION",
      confidence: 0.98,
      topic: topic.trim().replace(/\?$/, ""),
      action: "explain",
      endpoint: "/api/v1/ai/explain",
      requiresClarification: false,
      reason: "Explicit concept explanation query matched"
    };
  }

  // 3. PRACTICE matches
  if (
    clean.startsWith("give me a quiz on ") ||
    clean.startsWith("test my knowledge of ") ||
    clean.startsWith("i want to practice ") ||
    clean.includes("test me")
  ) {
    let topic = input;
    if (clean.startsWith("give me a quiz on ")) topic = input.slice(18);
    else if (clean.startsWith("test my knowledge of ")) topic = input.slice(21);
    else if (clean.startsWith("i want to practice ")) topic = input.slice(19);

    return {
      intent: "PRACTICE",
      confidence: 0.95,
      topic: topic.trim().replace(/\?$/, ""),
      action: "generate-quiz",
      endpoint: "/api/v1/ai/generate-quiz",
      requiresClarification: false,
      reason: "Explicit quiz practice query matched"
    };
  }

  // 4. CODE_REVIEW matches
  if (
    clean.includes("review my ") ||
    clean.includes("review code") ||
    clean.startsWith("check this code") ||
    clean.includes("is my implementation good")
  ) {
    return {
      intent: "CODE_REVIEW",
      confidence: 0.95,
      action: "code-review",
      endpoint: "/api/v1/ai/code-review",
      requiresClarification: false,
      reason: "Explicit code review query matched"
    };
  }

  // 5. DEBUG matches
  if (
    clean.includes("why am i getting this error") ||
    clean.startsWith("debug ") ||
    clean.includes("fix this ")
  ) {
    return {
      intent: "DEBUG",
      confidence: 0.95,
      action: "debug",
      endpoint: "/api/v1/ai/debug",
      requiresClarification: false,
      reason: "Explicit debugging request matched"
    };
  }

  // 6. RESEARCH matches
  if (
    clean.includes("research paper") ||
    clean.includes("research gap") ||
    clean.includes("explain this paper")
  ) {
    return {
      intent: "RESEARCH",
      confidence: 0.95,
      action: "research-analysis",
      endpoint: "/api/v1/ai/research-analysis",
      requiresClarification: false,
      reason: "Explicit research paper query matched"
    };
  }

  // 7. MOCK_INTERVIEW matches
  if (
    clean.includes("interview me") ||
    clean.includes("practice technical interviews") ||
    clean.includes("prepare me for a software engineering interview") ||
    clean.includes("prepare me for a developer interview")
  ) {
    return {
      intent: "MOCK_INTERVIEW",
      confidence: 0.95,
      action: "mock-interview",
      endpoint: "/api/v1/ai/mock-interview",
      requiresClarification: false,
      reason: "Explicit interview prep query matched"
    };
  }

  // 8. CAREER matches
  if (
    clean.startsWith("how do i become ") ||
    clean.includes("career roadmap") ||
    clean.startsWith("what should i learn to become ")
  ) {
    return {
      intent: "CAREER",
      confidence: 0.95,
      action: "career-roadmap",
      endpoint: "/api/v1/ai/career-roadmap",
      requiresClarification: false,
      reason: "Explicit career path mapping request matched"
    };
  }

  // 9. RESUME matches
  if (
    clean.includes("review my resume") ||
    clean.includes("analyze my cv")
  ) {
    return {
      intent: "RESUME",
      confidence: 0.95,
      action: "resume-analysis",
      endpoint: "/api/v1/ai/resume-analysis",
      requiresClarification: false,
      reason: "Explicit CV evaluation query matched"
    };
  }

  // 10. INTERACTIVE_LAB matches
  if (
    clean.startsWith("let me practice ") ||
    clean.includes("experiment with sorting") ||
    clean.includes("interactive lab")
  ) {
    return {
      intent: "INTERACTIVE_LAB",
      confidence: 0.95,
      action: "interactive-lab",
      endpoint: "/api/v1/ai/interactive-lab",
      requiresClarification: false,
      reason: "Explicit interactive lab request matched"
    };
  }

  return null;
}

export const routeIntent = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return sendSuccessResponse(res, {
      intent: "UNKNOWN",
      confidence: 0.0,
      requiresClarification: true,
      options: ["explanation", "course", "practice"]
    });
  }

  // A. Check deterministic rules first
  const deterministicResult = getDeterministicIntent(query);
  if (deterministicResult) {
    return sendSuccessResponse(res, deterministicResult);
  }

  // B. Fall back to LLM Classifier
  const systemPrompt = `You are the intent router for SikhoAI. Your goal is to analyze the learner's input and classify it into one of these intents:
- CONCEPT_EXPLANATION (endpoint: "/api/v1/ai/explain", action: "explain")
- COURSE_REQUEST (endpoint: "/api/v1/ai/generate-course", action: "generate-course")
- PRACTICE (endpoint: "/api/v1/ai/generate-quiz", action: "generate-quiz")
- CODE_REVIEW (endpoint: "/api/v1/ai/code-review", action: "code-review")
- DEBUG (endpoint: "/api/v1/ai/debug", action: "debug")
- DOUBT_SOLVE (endpoint: "/api/v1/ai/doubt-solve", action: "doubt-solve")
- MOCK_INTERVIEW (endpoint: "/api/v1/ai/mock-interview", action: "mock-interview")
- RESEARCH (endpoint: "/api/v1/ai/research-analysis", action: "research-analysis")
- INTERACTIVE_LAB (endpoint: "/api/v1/ai/interactive-lab", action: "interactive-lab")
- RESUME (endpoint: "/api/v1/ai/resume-analysis", action: "resume-analysis")
- CAREER (endpoint: "/api/v1/ai/career-roadmap", action: "career-roadmap")
- UNKNOWN (if completely ambiguous, like "help me with Java")

Classification Guidelines:
- If a user asks "I want to learn system design" or "I want to learn Java", these are broad topics showing a learning goal: route to COURSE_REQUEST.
- If a user asks a short query like "What is Java?" or "Explain Java inheritance", these are specific concept requests: route to CONCEPT_EXPLANATION.
- If the user query is very short/ambiguous like "help me with Java", set intent to "UNKNOWN" and requiresClarification to true.

Output strictly a JSON object:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "topic": "extracted topic",
  "action": "action-name",
  "endpoint": "associated endpoint",
  "requiresClarification": false,
  "reason": "short explanation"
}

If requiresClarification is true, set intent to "UNKNOWN", confidence < 0.6, and include:
{
  "intent": "UNKNOWN",
  "confidence": 0.51,
  "requiresClarification": true,
  "options": ["explanation", "course", "practice"],
  "reason": "Clarification needed"
}`;

  try {
    const aiResponse = await queryAIWithJsonRotation(systemPrompt, query);
    return sendSuccessResponse(res, aiResponse, "Intent classified successfully");
  } catch (error) {
    // Default fallback to CONCEPT_EXPLANATION
    return sendSuccessResponse(res, {
      intent: "CONCEPT_EXPLANATION",
      confidence: 0.70,
      topic: query,
      action: "explain",
      endpoint: "/api/v1/ai/explain",
      requiresClarification: false,
      reason: "Fallback to concept explanation due to processing error"
    });
  }
});
