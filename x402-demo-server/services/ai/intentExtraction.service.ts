import { queryAIWithJsonRotation } from "./aiRotator";

export interface IIntentExtractionResult {
  targetCareer: string;
  location: string;
  experienceLevel: string;
  remote: boolean;
}

const SYSTEM_PROMPT = `You are an expert recruitment assistant. Extract target career parameters from the user's career transition prompt.
You MUST return a JSON object with this exact structure:
{
  "targetCareer": "string (the normalized target role. For example, normalize 'ml engineer' or 'machine learning' to 'Machine Learning Engineer', 'data scientist' to 'Data Scientist', 'ai engineer' -> 'AI Engineer', 'mlops' -> 'MLOps Engineer', 'data analyst' -> 'Data Analyst', 'software engineer' -> 'Software Engineer'.)",
  "location": "string (the target city/region, e.g. 'Hyderabad', 'Bengaluru', 'Mumbai', or 'Remote'. Default to 'India' if unspecified.)",
  "experienceLevel": "string (Must be one of: 'Internship', 'Entry Level', 'Mid-Senior', 'Senior Level'. Choose based on years or keywords like 'fresher', 'intern', 'senior', 'lead'. Default to 'Entry Level' if unspecified.)",
  "remote": boolean (true if user explicitly mentions 'remote', otherwise false)
}

Be concise and precise. Ensure the JSON is completely valid and follows the schema.`;

export async function extractCareerIntent(prompt: string): Promise<IIntentExtractionResult> {
  try {
    const result = await queryAIWithJsonRotation(SYSTEM_PROMPT, prompt);
    
    // Normalize properties
    const targetCareer = result.targetCareer || "Machine Learning Engineer";
    const location = result.location || "India";
    const experienceLevel = result.experienceLevel || "Entry Level";
    const remote = !!result.remote;
    
    return { targetCareer, location, experienceLevel, remote };
  } catch (err: any) {
    console.warn("[IntentExtractionService] AI extraction failed, running fallback parser:", err.message);
    return fallbackExtractIntent(prompt);
  }
}

export function fallbackExtractIntent(prompt: string): IIntentExtractionResult {
  const lower = prompt.toLowerCase();
  
  let targetCareer = "Machine Learning Engineer";
  if (lower.includes("ml engineer") || lower.includes("machine learning")) {
    targetCareer = "Machine Learning Engineer";
  } else if (lower.includes("ai engineer")) {
    targetCareer = "AI Engineer";
  } else if (lower.includes("mlops")) {
    targetCareer = "MLOps Engineer";
  } else if (lower.includes("data scientist")) {
    targetCareer = "Data Scientist";
  } else if (lower.includes("data analyst")) {
    targetCareer = "Data Analyst";
  } else if (lower.includes("software engineer")) {
    targetCareer = "Software Engineer";
  }

  let location = "India";
  if (lower.includes("hyderabad")) {
    location = "Hyderabad";
  } else if (lower.includes("bengaluru") || lower.includes("bangalore")) {
    location = "Bengaluru";
  } else if (lower.includes("pune")) {
    location = "Pune";
  } else if (lower.includes("mumbai")) {
    location = "Mumbai";
  } else if (lower.includes("noida")) {
    location = "Noida";
  } else if (lower.includes("chennai")) {
    location = "Chennai";
  } else if (lower.includes("remote")) {
    location = "Remote";
  }

  let experienceLevel = "Entry Level";
  if (lower.includes("intern")) {
    experienceLevel = "Internship";
  } else if (lower.includes("senior") || lower.includes("2+ years") || lower.includes("2+ yrs") || lower.includes("lead") || lower.includes("5+ years")) {
    experienceLevel = "Senior Level";
  } else if (lower.includes("fresher") || lower.includes("junior") || lower.includes("entry")) {
    experienceLevel = "Entry Level";
  }

  const remote = lower.includes("remote");

  return { targetCareer, location, experienceLevel, remote };
}
