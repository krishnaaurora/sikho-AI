import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { queryAIWithJsonRotation } from "../../services/ai/aiRotator";

// 1. Explain
export const explainConceptMvp = asyncHandler(async (req: Request, res: Response) => {
  const { query, learningStyle = "academic", language = "English" } = req.body;
  if (!query) throw new AppError("Query string parameter is required", 400);

  const stylePrompts: Record<string, string> = {
    academic: "Focus on formal definitions, terminology, background context, and clear structures.",
    visual: "Focus on describing steps visually, mappings, architectural components, and visual relationships.",
    practical: "Focus on real-world implementation, code blocks, scenario walkthroughs, and practical context.",
    interview: "Focus on sharp, confident definitions, potential interview questions, and deep follow-ups.",
    beginner: "Focus on analogies, plain English without jargon, and detailed prerequisite explanations."
  };

  const selectedStyleDesc = stylePrompts[learningStyle] || stylePrompts.academic;

  const system = `You are a personalized learning assistant. 
Generate a structured explanation of the topic.
Format your entire output as a JSON object matching this schema:
{
  "endpoint": "explain",
  "topic": "${query}",
  "definition": "A clear definition in simple English",
  "howItWorks": ["Step 1...", "Step 2..."],
  "examples": ["Concrete example 1", "Concrete example 2"],
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2"]
}
Strictly output JSON only.`;

  const user = `Explain "${query}" in ${language}. Style preference: ${selectedStyleDesc}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Explanation generated successfully");
});

// 2. Doubt Solve
export const doubtSolveMvp = asyncHandler(async (req: Request, res: Response) => {
  const { doubt } = req.body;
  if (!doubt) throw new AppError("Doubt string parameter is required", 400);

  const system = `You are a helpful teaching assistant. Answer the student's doubt directly and clearly.
Format your output as a JSON object:
{
  "endpoint": "doubt-solve",
  "question": "${doubt}",
  "answer": "Clear detailed answer",
  "example": "A concrete real-world example explaining the concept",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
}
Strictly output JSON only.`;

  const responseJson = await queryAIWithJsonRotation(system, doubt);
  return sendSuccessResponse(res, responseJson, "Doubt resolved successfully");
});

// 3. Code Review
export const codeReviewMvp = asyncHandler(async (req: Request, res: Response) => {
  const { language = "python", code } = req.body;
  if (!code) throw new AppError("Code string parameter is required", 400);

  const system = `You are an expert software reviewer. Review the provided code.
Format your output as a JSON object:
{
  "endpoint": "code-review",
  "summary": "High-level summary of code quality and design",
  "issues": ["Issue 1 with line number", "Issue 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "improvedCode": "Optimized, corrected version of the code"
}
Strictly output JSON only.`;

  const user = `Language: ${language}\nCode:\n${code}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Code review completed");
});

// 4. Debug
export const debugMvp = asyncHandler(async (req: Request, res: Response) => {
  const { language = "python", code, error } = req.body;
  if (!code) throw new AppError("Code is required to debug", 400);

  const system = `You are an expert debugging assistant. Identify the bug and fix it.
Format your output as a JSON object:
{
  "endpoint": "debug",
  "problem": "Brief description of the bug",
  "cause": "Underlying root cause of the error",
  "solution": "How to resolve it step-by-step",
  "fixedCode": "Corrected code snippet"
}
Strictly output JSON only.`;

  const user = `Language: ${language}\nCode:\n${code}\nError:\n${error || "Not specified"}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Debugging completed");
});

// 5. Generate Quiz
export const generateQuizMvp = asyncHandler(async (req: Request, res: Response) => {
  const { topic, difficulty = "medium", numberOfQuestions = 5 } = req.body;
  if (!topic) throw new AppError("Topic is required to generate quiz", 400);

  const system = `You are a quiz master. Create a multiple-choice quiz about the given topic.
Format your output as a JSON object:
{
  "endpoint": "generate-quiz",
  "topic": "${topic}",
  "questions": [
    {
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "The exact string match of correct option",
      "explanation": "Why this option is correct"
    }
  ]
}
Generate exactly ${numberOfQuestions} questions. Strictly output JSON only.`;

  const user = `Topic: ${topic}, Difficulty: ${difficulty}, Count: ${numberOfQuestions}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Quiz generated successfully");
});

// 6. Mock Interview
export const mockInterviewMvp = asyncHandler(async (req: Request, res: Response) => {
  const { role, experience = "Fresher", numberOfQuestions = 5, answers } = req.body;
  if (!role) throw new AppError("Role is required to generate interview", 400);

  // Evaluative answer feedback flow
  if (answers && Array.isArray(answers)) {
    const evaluateSystem = `You are a technical interviewer evaluating candidate answers.
Format your output as a JSON object:
{
  "endpoint": "mock-interview",
  "score": 85,
  "feedback": "Overall performance feedback text",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement suggestion 1", "Improvement 2"]
}
Strictly output JSON only.`;
    const userPrompt = `Role: ${role}, Answers: ${JSON.stringify(answers)}`;
    const responseJson = await queryAIWithJsonRotation(evaluateSystem, userPrompt);
    return sendSuccessResponse(res, responseJson, "Interview evaluation complete");
  }

  // Basic question listing flow
  const system = `You are a technical interviewer. Generate mock interview questions.
Format your output as a JSON object:
{
  "endpoint": "mock-interview",
  "role": "${role}",
  "questions": [
    {
      "question": "Question text",
      "difficulty": "easy"
    }
  ]
}
Generate exactly ${numberOfQuestions} questions. Strictly output JSON only.`;

  const user = `Role: ${role}, Experience: ${experience}, Questions Count: ${numberOfQuestions}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Mock interview generated successfully");
});

// 7. Research Analysis
export const researchAnalysisMvp = asyncHandler(async (req: Request, res: Response) => {
  const { title, abstract } = req.body;
  if (!abstract) throw new AppError("Abstract text is required to analyze", 400);

  const system = `You are a research paper analysis tool. Extract key parameters from paper abstract details.
Format your output as a JSON object:
{
  "endpoint": "research-analysis",
  "summary": "Detailed summary",
  "problem": "Problem being solved",
  "methodology": "Research methodology described",
  "keyFindings": ["Finding 1", "Finding 2"],
  "limitations": ["Limitation 1", "Limitation 2"],
  "researchGap": "Future directions / gaps"
}
Strictly output JSON only.`;

  const user = `Title: ${title || "Untitled Paper"}\nAbstract:\n${abstract}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Research analysis complete");
});

// 8. Interactive Lab
export const interactiveLabMvp = asyncHandler(async (req: Request, res: Response) => {
  const { labId, topic } = req.body;
  if (!topic) throw new AppError("Topic is required to build lab session", 400);

  const system = `You are a lab simulation builder. Create a structured interactive learning experiment.
Format your output as a JSON object:
{
  "endpoint": "interactive-lab",
  "title": "Lab Title",
  "objective": "Objective statement",
  "steps": [
    {
      "step": 1,
      "action": "Action instruction details",
      "expectedResult": "Expected output/result details"
    }
  ]
}
Strictly output JSON only.`;

  const user = `LabId: ${labId || "unassigned"}, Topic: ${topic}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Lab experiment generated");
});

// 9. Resume Analysis
export const resumeAnalysisMvp = asyncHandler(async (req: Request, res: Response) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) throw new AppError("Resume text is required to analyze", 400);

  const system = `You are an applicant tracking system analyzer. Grade the resume against target job description.
Format your output as a JSON object:
{
  "endpoint": "resume-analysis",
  "score": 75,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "missingSkills": ["Required skill 1", "Skill 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
Strictly output JSON only.`;

  const user = `Role: ${targetRole || "Software Engineer"}\nResume:\n${resumeText}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Resume analysis complete");
});

// 10. Career Roadmap
export const careerRoadmapMvp = asyncHandler(async (req: Request, res: Response) => {
  const { targetRole, currentSkills = [], experienceLevel = "Beginner" } = req.body;
  if (!targetRole) throw new AppError("Target role is required to plot career path", 400);

  const system = `You are a career guidance advisor. Generate a monthly roadmap.
Format your output as a JSON object:
{
  "endpoint": "career-roadmap",
  "targetRole": "${targetRole}",
  "roadmap": [
    {
      "month": 1,
      "focus": "Topic focus area",
      "skills": ["Skill 1", "Skill 2"],
      "milestones": ["Milestone check 1"]
    }
  ]
}
Strictly output JSON only.`;

  const user = `TargetRole: ${targetRole}\nSkills:\n${JSON.stringify(currentSkills)}\nLevel: ${experienceLevel}`;
  const responseJson = await queryAIWithJsonRotation(system, user);
  return sendSuccessResponse(res, responseJson, "Career roadmap compiled");
});
