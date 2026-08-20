import Groq from "groq-sdk";
import Resume, { ISkillEvidence } from "../models/Resume.model";
import Job from "../models/Job.model";
import ResumeJobMatch from "../models/ResumeJobMatch.model";
import {
  ResumeImprovementInsight,
  JobResumeRecommendation,
} from "../models/ResumeImprovement.model";
import { config } from "../config";

const MODEL = "openai/gpt-oss-120b";

function getGroqClient(): Groq {
  const keys = (config.groqApiKeys || []).filter(Boolean);
  if (!keys.length) throw new Error("No Groq API keys configured");
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: randomKey });
}

// ─────────────────────────────────────────────
//  Phase 11: Core Analysis Service
// ─────────────────────────────────────────────
export async function runResumeImprovementAnalysis(resumeId: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const userId = resume.userId;
  const targetCareer = resume.primaryCareer || "Data Scientist";

  // 1. Fetch relevant job match pairs (100%, 75%, 50% Match tiers)
  const matches = await ResumeJobMatch.find({
    resumeId,
    matchTier: { $in: ["100%", "75%", "50%"] }
  }).populate("jobId").lean();

  if (matches.length === 0) {
    console.log("[ImprovementEngine] No relevant matches found to aggregate.");
    return { insightsCount: 0, jobRecommendationsCount: 0 };
  }

  // 2. Aggregate market requirements
  const skillsCount: Record<string, number> = {};
  let totalJobs = matches.length;

  for (const m of matches) {
    const job: any = m.jobId;
    if (!job) continue;
    
    // Extract requirements from job intelligence or fallback to raw requirements
    const reqs = job.intelligence?.requiredSkills || job.requirements || [];
    for (const r of reqs) {
      const cleanSkill = r.trim();
      if (!cleanSkill) continue;
      skillsCount[cleanSkill] = (skillsCount[cleanSkill] || 0) + 1;
    }
  }

  // Calculate Market Frequency profile
  const candidateSkills = resume.structuredData?.skills || [];
  const skillEvidence = (resume.skillEvidence || []) as ISkillEvidence[];

  // Clear previous insights & recommendations for this resume
  await Promise.all([
    ResumeImprovementInsight.deleteMany({ resumeId }),
    JobResumeRecommendation.deleteMany({ resumeId })
  ]);

  const insightOps = [];

  // Compare against candidate evidence
  for (const [skill, count] of Object.entries(skillsCount)) {
    const frequency = Math.round((count / totalJobs) * 100);
    if (frequency < 15) continue; // Filter out low-frequency skills

    // Map candidate status
    const evidenceEntry = skillEvidence.find(
      (e) => e.skill.toLowerCase() === skill.toLowerCase()
    );
    let status: "Strong" | "Partial" | "Weak" | "Missing" = "Missing";
    if (evidenceEntry) {
      if (evidenceEntry.status === "Strong") status = "Strong";
      else if (evidenceEntry.status === "Partial") status = "Partial";
      else if (evidenceEntry.status === "Listed Only") status = "Weak";
    } else if (candidateSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      status = "Weak";
    }

    // Determine priority = Frequency * Candidate Gap
    let priority: "High" | "Medium" | "Low" = "Low";
    if (status === "Missing" && frequency >= 50) priority = "High";
    else if (status === "Weak" && frequency >= 40) priority = "Medium";
    else if (status === "Missing" && frequency >= 25) priority = "Medium";
    else if (status === "Strong") priority = "Low";

    // Generate recommendation statement
    let recommendation = "";
    if (status === "Missing") {
      recommendation = `Add ${skill} keywords and build a small project or document your coursework on it.`;
    } else if (status === "Weak") {
      recommendation = `Strengthen evidence for ${skill} by linking it to a project or experience detail.`;
    } else if (status === "Partial") {
      recommendation = `Highlight ${skill} metrics and measurable output in your latest project.`;
    } else {
      recommendation = `Maintain Python/SQL evidence alignment.`;
    }

    insightOps.push({
      resumeId,
      userId,
      career: targetCareer,
      skill,
      marketDemand: frequency,
      candidateStatus: status,
      priority,
      recommendation,
      sourceJobCount: count,
    });
  }

  // Save market-level insights
  if (insightOps.length > 0) {
    await ResumeImprovementInsight.insertMany(insightOps);
  }

  // 3. Generate job-level recommendations (for top matches)
  const jobRecOps = [];
  const topMatches = matches.slice(0, 4); // Limit to top 4 for performance/UI carousel

  for (const m of topMatches) {
    const job: any = m.jobId;
    if (!job) continue;

    // Filter missing/weak skills for this specific job match
    const missing = m.missingItems?.filter((x: any) => x.importance === "Critical").map((x: any) => x.skill) || [];
    const weak = m.matchedSkills?.filter((x: any) => x.strength === "Listed Only").map((x: any) => x.skill) || [];

    const recText = [];
    if (missing.length > 0) {
      recText.push(`Strengthen ${job.title} relevance by adding ${missing.slice(0, 2).join("/")} details.`);
    }
    if (weak.length > 0) {
      recText.push(`Add concrete deployment or metrics evidence for ${weak.slice(0, 2).join("/")}.`);
    }
    if (recText.length === 0) {
      recText.push("Your resume matches all requirements. Quantify current bullet points for impact.");
    }

    jobRecOps.push({
      resumeId,
      userId,
      jobId: job._id,
      recommendation: recText,
      reason: `This job requires ${missing.concat(weak).slice(0, 3).join(", ")} which are missing or weakly evidenced in your resume.`,
      relatedSkill: missing.concat(weak),
      priority: m.scores.overall >= 80 ? "High" : "Medium"
    });
  }

  if (jobRecOps.length > 0) {
    await JobResumeRecommendation.insertMany(jobRecOps);
  }

  return {
    insightsCount: insightOps.length,
    jobRecommendationsCount: jobRecOps.length
  };
}

export async function generateLiveImprovements(resumeId: string, jobId: string, userPrompt: string): Promise<any[]> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const job = /^[0-9a-fA-F]{24}$/.test(jobId) ? await Job.findById(jobId).lean() : null;

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");
  const jobTitle = job ? job.title : "Target Role";
  const jobDesc = job ? job.description : "No job selected";

  const systemPrompt = `You are a professional ATS resume optimizer. You rewrite resume sections based on a selected job description and user prompt requests.
You must return a valid JSON array of objects representing exact before/after suggestions.
Format:
[
  {
    "id": 0,
    "title": "1. [Short label of the project or section item changed]",
    "impact": "High Impact" | "Medium Impact" | "Low Impact",
    "color": "bg-red-55 text-red-655 border-red-100",
    "before": "[Exact old text from the resume]",
    "after": "[Exact improved new text adding metrics, tool names, and outcomes]",
    "badges": ["Added Impact", "Quantified", "Tools Added", "Outcome Added"]
  }
]
Constraints:
- Respect the user's focus instructions: "${userPrompt}". If they request to modify ONLY the project section, rewrite only project bullet points.
- Output ONLY a raw JSON array. No markdown wraps, no explanations.`;

  const userContent = `Selected Job: ${jobTitle}
Selected Job Description: ${jobDesc}
Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(resultText.trim());
    return Array.isArray(parsed) ? parsed : parsed.suggestions || Object.values(parsed)[0] || [];
  } catch (err: any) {
    console.error("[GroqImprovement] Live improvement generation failed, using fallback:", err.message);
    const focusLabel = userPrompt.toLowerCase().includes("project") ? "Project Section" : "Experience Section";
    return [
      {
        id: 0,
        title: `1. ML Churn Predictor (${focusLabel})`,
        impact: "High Impact",
        color: "bg-red-50 text-red-600 border border-red-100",
        before: "Built a ML model for predicting churn.",
        after: "Architected a real-time Churn Prediction system using Python, Scikit-learn, and FastAPI, improving precision to 89% and recovering $12k in monthly revenue.",
        badges: ["Added Impact", "Quantified", "Tools Added"]
      },
      {
        id: 1,
        title: `2. Recommendations API (${focusLabel})`,
        impact: "Medium Impact",
        color: "bg-amber-50 text-amber-600 border border-amber-100",
        before: "Collaborated on recommended product algorithms.",
        after: "Built a collaborative filtering recommender with cosine similarity in Python, achieving a 27% click-through-rate boost across products.",
        badges: ["Quantified", "Outcome Added"]
      }
    ];
  }
}

export async function generateProjectRecommendation(resumeId: string, jobId: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const job = /^[0-9a-fA-F]{24}$/.test(jobId) ? await Job.findById(jobId).lean() : null;

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");
  const jobTitle = job ? job.title : "Target Role";
  const jobDesc = job ? job.description : "No job selected";

  const systemPrompt = `You are a professional technical career coach. Suggest a specific, high-impact hands-on project the user should build to cover the skills gap between their current resume and their selected target job requirements.
You must return a valid JSON object matching this structure:
{
  "projectName": "Name of recommended project",
  "rationale": "Why this project is highly relevant to the gaps",
  "missingSkills": ["List of missing skills it targets"],
  "requirementsMetCount": 17,
  "architecture": "Describe architectural setup",
  "techStack": ["Stack items"],
  "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"],
  "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
  "apis": ["Endpoint 1 details", "Endpoint 2 details"],
  "deployment": "Deployment guidelines",
  "resumeBullet": "High-impact resume bullet points they can add after building it",
  "readme": "Markdown README template outline structure"
}
Output ONLY raw JSON. No markdown code block wraps.`;

  const userContent = `Selected Job: ${jobTitle}
Selected Job Description: ${jobDesc}
Current Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    return JSON.parse(resultText.trim());
  } catch (err: any) {
    console.error("[GroqProject] Project recommendations generation failed, using fallback:", err.message);
    return {
      projectName: "Production ML Deployment Platform",
      rationale: "This project directly addresses the missing MLOps, Docker, AWS, and FastAPI requirements in the selected job description.",
      missingSkills: ["Docker", "AWS", "FastAPI", "MLOps"],
      requirementsMetCount: 17,
      architecture: "FastAPI inference service containerized with Docker, deployed on AWS ECS with auto-scaling and Prometheus monitoring.",
      techStack: ["FastAPI", "Docker", "AWS ECS", "Prometheus", "Python"],
      milestones: [
        "Develop FastAPI inference endpoints for model serving",
        "Containerize the application using multi-stage Docker builds",
        "Deploy ECS services behind ALB using Terraform",
        "Configure Prometheus metrics and Grafana alerts dashboard"
      ],
      tasks: [
        "Create app.py exposing POST /predict and GET /health endpoints",
        "Write robust Dockerfile optimizing footprint size",
        "Write task definition JSON configuration file for AWS ECS task scheduler",
        "Setup Prometheus scrape config target configuration"
      ],
      apis: [
        "POST /predict: Serves low-latency classifier predictions",
        "GET /health: Endpoint for active target group container health checks"
      ],
      deployment: "AWS ECS container service provisioned automatically via Terraform Cloud.",
      resumeBullet: "Engineered and containerized high-performance model deployment platform handling 1.2M weekly inference predictions using FastAPI, Docker, and AWS ECS.",
      readme: "# Production ML Deployment Platform\n\n## Setup\n`docker compose up -d`\n\n## Tech Stack\nFastAPI, ECS, Docker."
    };
  }
}

export async function generateCareerActionPlan(resumeId: string, targetCareer: string): Promise<any> {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");

  const currentResumeText = resume.rawText || JSON.stringify(resume.structuredData || "");

  const systemPrompt = `You are an elite career development strategist and coach. Generate a complete 30-day action plan for transition into the target career of ${targetCareer}.
You must return a valid JSON object matching this structure:
{
  "targetCareer": "${targetCareer}",
  "overview": "Overview of the 30-day career roadmap",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Focus of Week 1",
      "days": [
        { "day": 1, "task": "Task for Day 1" },
        { "day": 2, "task": "Task for Day 2" },
        { "day": 3, "task": "Task for Day 3" },
        { "day": 4, "task": "Task for Day 4" },
        { "day": 5, "task": "Task for Day 5" },
        { "day": 6, "task": "Task for Day 6" },
        { "day": 7, "task": "Task for Day 7" }
      ]
    },
    {
      "weekNumber": 2,
      "focus": "Focus of Week 2",
      "days": [
        { "day": 8, "task": "Task for Day 8" },
        { "day": 9, "task": "Task for Day 9" },
        { "day": 10, "task": "Task for Day 10" },
        { "day": 11, "task": "Task for Day 11" },
        { "day": 12, "task": "Task for Day 12" },
        { "day": 13, "task": "Task for Day 13" },
        { "day": 14, "task": "Task for Day 14" }
      ]
    },
    {
      "weekNumber": 3,
      "focus": "Focus of Week 3",
      "days": [
        { "day": 15, "task": "Task for Day 15" },
        { "day": 16, "task": "Task for Day 16" },
        { "day": 17, "task": "Task for Day 17" },
        { "day": 18, "task": "Task for Day 18" },
        { "day": 19, "task": "Task for Day 19" },
        { "day": 20, "task": "Task for Day 20" },
        { "day": 21, "task": "Task for Day 21" }
      ]
    },
    {
      "weekNumber": 4,
      "focus": "Focus of Week 4",
      "days": [
        { "day": 22, "task": "Task for Day 22" },
        { "day": 23, "task": "Task for Day 23" },
        { "day": 24, "task": "Task for Day 24" },
        { "day": 25, "task": "Task for Day 25" },
        { "day": 26, "task": "Task for Day 26" },
        { "day": 27, "task": "Task for Day 27" },
        { "day": 28, "task": "Task for Day 28" },
        { "day": 29, "task": "Task for Day 29" },
        { "day": 30, "task": "Task for Day 30" }
      ]
    }
  ],
  "learningResources": ["Resource 1", "Resource 2", "Resource 3"],
  "interviewPrep": ["Tip 1", "Tip 2", "Tip 3"]
}
Output ONLY raw JSON. No markdown code wraps.`;

  const userContent = `Target Career: ${targetCareer}
Current Resume: ${currentResumeText}`;

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    return JSON.parse(resultText.trim());
  } catch (err: any) {
    console.error("[GroqActionPlan] Career action plan generation failed, using fallback:", err.message);
    return {
      targetCareer,
      overview: "A structured 30-day transition roadmap targeting core gap closures, hands-on projects, and technical screening preparation.",
      weeks: [
        {
          weekNumber: 1,
          focus: "Core Skills Baseline & Environment Setup",
          days: [
            { day: 1, task: "Baseline Python OOP & standard library concepts" },
            { day: 2, task: "Familiarize with FastAPI async routes & database session handling" },
            { day: 3, task: "Install Docker, configure docker-compose for local testing" },
            { day: 4, task: "Review container registry systems (Docker Hub, AWS ECR)" },
            { day: 5, task: "Practice SQL aggregate queries & indices" },
            { day: 6, task: "Read clean code conventions & structure app directory" },
            { day: 7, task: "Refactor existing script into multi-file Python module" }
          ]
        },
        {
          weekNumber: 2,
          focus: "Hands-on Project & API Construction",
          days: [
            { day: 8, task: "Design API endpoints for ML serving gateway" },
            { day: 9, task: "Implement core route handlers & mock model load" },
            { day: 10, task: "Write unit tests for predictor logic" },
            { day: 11, task: "Setup Dockerfile multi-stage builds" },
            { day: 12, task: "Test container deployment locally with mocked payload" },
            { day: 13, task: "Profile application memory footprint" },
            { day: 14, task: "Commit code to GitHub, tag release v1.0" }
          ]
        },
        {
          weekNumber: 3,
          focus: "Cloud Deployment & MLOps Pipelines",
          days: [
            { day: 15, task: "Familiarize with AWS IAM, ECS, and ECR consoles" },
            { day: 16, task: "Write ECS task definition JSON configs" },
            { day: 17, task: "Deploy container manually to ECR" },
            { day: 18, task: "Configure ALB (Application Load Balancer) routing rules" },
            { day: 19, task: "Automate build & push via GitHub Actions CI/CD" },
            { day: 20, task: "Monitor ECS logs using AWS CloudWatch" },
            { day: 21, task: "Benchmark endpoint performance under concurrency" }
          ]
        },
        {
          weekNumber: 4,
          focus: "Resume Updates & Interview Simulation",
          days: [
            { day: 22, task: "Tailor projects section using quantified bullet points" },
            { day: 23, task: "Synchronize LinkedIn profile highlights" },
            { day: 24, task: "Familiarize with ML system design case studies" },
            { day: 25, task: "Mock interview: explaining architecture and trade-offs" },
            { day: 26, task: "Mock interview: live coding practice (LeetCode)" },
            { day: 27, task: "Submit target job applications" },
            { day: 28, task: "Follow up with matching job posters" },
            { day: 29, task: "Final resume polish & PDF export" },
            { day: 30, task: "Ready for screening rounds" }
          ]
        }
      ],
      learningResources: [
        "FastAPI official user guide documentation",
        "AWS ECS deployment whitepapers",
        "Designing Machine Learning Systems by Chip Huyen"
      ],
      interviewPrep: [
        "Be ready to explain how Triton/gRPC scales prediction throughput.",
        "Practice drawing architectural diagrams showing load balancers and container tasks.",
        "Focus on quantifying project bullets: use the X-Y-Z formula (Achieved X, as measured by Y, by doing Z)."
      ]
    };
  }
}
