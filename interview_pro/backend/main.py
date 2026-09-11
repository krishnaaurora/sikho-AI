import os
import re
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv

# ── PDF / DOCX text extraction ──────────────────────────────────────────────
try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    from docx import Document as DocxDocument
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

# ── Setup ────────────────────────────────────────────────────────────────────
load_dotenv()
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

# Load Groq keys from GROQ_API_KEY_20 to GROQ_API_KEY_27 (dedicated for interview prep)
GROQ_KEYS = [
    os.getenv(f"GROQ_API_KEY_{i}") 
    for i in range(20, 28) 
    if os.getenv(f"GROQ_API_KEY_{i}")
]

if not GROQ_KEYS:
    fallback_key = os.getenv("GROQ_API_KEY")
    if fallback_key:
        GROQ_KEYS = [fallback_key]

if not GROQ_KEYS:
    logger.error("No Groq API keys found in environment! Please configure GROQ_API_KEY_20 to GROQ_API_KEY_27.")
else:
    logger.info(f"Successfully loaded {len(GROQ_KEYS)} Groq keys (GROQ_API_KEY_20 to 27)")

groq_key_index = 0

def get_groq_client() -> Groq:
    global groq_key_index
    if not GROQ_KEYS:
        raise HTTPException(status_code=500, detail="No Groq API keys configured in backend (.env).")
    key = GROQ_KEYS[groq_key_index % len(GROQ_KEYS)]
    groq_key_index = (groq_key_index + 1) % len(GROQ_KEYS)
    return Groq(api_key=key)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Interview Prep & AI Gap Intelligence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Text extraction ──────────────────────────────────────────────────────────

def extract_text_from_pdf(path: Path) -> str:
    if not HAS_PYPDF:
        return ""
    try:
        reader = pypdf.PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        logger.warning(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(path: Path) -> str:
    if not HAS_DOCX:
        return ""
    try:
        doc = DocxDocument(str(path))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        logger.warning(f"DOCX extraction error: {e}")
        return ""

def extract_text(path: Path, filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(path)
    elif ext in ("doc", "docx"):
        return extract_text_from_docx(path)
    return path.read_text(encoding="utf-8", errors="ignore")

# ── Prompt Templates ─────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """You are a Principal Software Architect, Senior Technical Interviewer, and Executive Technical Recruiter.
Carefully analyze the candidate's RESUME against the target JOB DESCRIPTION (JD) for a candidate with target level "{experience_level}" who has {days_to_interview} days to prepare.

Identify the precise gaps between what the Job Description requires and what the Resume actually demonstrates.
Transform the identified gaps into a deep, structured, 9-step learning journey:
WHY (Problem) → WHAT (Concept) → HOW (Internals) → REAL WORLD (Production Patterns) → ENGINEERING SCENARIO (How would you solve this?) → FOLLOW-UPS → INTERVIEW CONNECTION.

You MUST generate ALL of the following sections in pure JSON format:

1. resumeMatchScore (int 0-100)
2. estimatedLearningTime (int hours)
3. experienceLevel ("{experience_level}")
4. existingSkills (list of matching skills found in resume)
5. focusAreas (list of 3-5 top priority gaps)
6. gapAnalysis (object containing):
   - overallMatchScore (int 0-100)
   - skillsMatchScore (int 0-100)
   - experienceMatchScore (int 0-100)
   - domainFitScore (int 0-100)
   - summary (2-3 sentence executive summary of gap analysis)
   - missingSkills: array of 3-5 objects with {{ "skill": string, "category": string, "priority": "High"|"Medium"|"Low", "importanceInJd": string, "reason": string, "recommendation": string }}
   - strengthenSkills: array of 2-4 objects with {{ "skill": string, "category": string, "priority": "High"|"Medium"|"Low", "currentEvidence": string, "targetDepth": string, "recommendation": string }}
   - experienceGaps: array of 2-4 objects with {{ "area": string, "gap": string, "impact": "Critical"|"Moderate"|"Minor", "howToBridge": string }}
   - matchedStrengths: array of 3-5 objects with {{ "skill": string, "evidence": string, "relevanceToJd": string }}
   - quickWins: array of 3 actionable items to prepare in next 24-48 hours
   - actionPlan: array of 3 phases with {{ "phase": string, "timeframe": string, "focus": string, "tasks": string[] }}
7. learningTracks: array of 2-3 tracks directly addressing the identified gaps. Each track has:
   - trackTitle (string)
   - description (string)
   - modules: array of 2-3 modules. For EVERY module, you MUST provide:
     * id (e.g. "mod-1")
     * title (string, e.g. "HashMap Internals & Fast Lookups" or "Distributed Caching with Redis" or "Database Indexing & B-Trees")
     * difficulty ("Beginner"|"Intermediate"|"Advanced")
     * estimatedTime (e.g. "30 mins")
     * why (string, starting with a concrete real-world problem: e.g. "Searching millions of users sequentially is too slow...")
     * what (string, clear breakdown of what the concept is and core terminology)
     * how (string, step-by-step internal execution mechanism)
     * realWorld: array of 3-4 objects with {{ "domain": string (e.g. "🛒 E-Commerce" | "🏦 Banking" | "🌐 Web Auth" | "⚡ High-Throughput Caching"), "pattern": string, "productionNote": string }}
     * scenario (string, a realistic engineering challenge: "How would you solve this problem? Explain what you would use, trade-offs, and failure handling.")
     * progressiveHints: array of 3 progressive hints (e.g. ["What data changes frequently?", "Could we avoid querying DB repeatedly?", "Think about cache-aside with TTL"])
     * followUpQuestions: array of 3 probing interview questions (e.g. ["Why Redis over Postgres?", "What happens if Redis goes down?", "How do you handle cache invalidation?"])
     * keyConcepts: array of 2 objects {{ "title": string, "description": string }}
     * codeExample: {{ "language": string, "code": string }}
8. interviewQuestions: array of 6-10 realistic, high-yield technical and architectural interview questions targeting the candidate's exact gaps. Each question MUST have:
   - question (string)
   - difficulty ("easy"|"medium"|"hard")
   - category (string, e.g. "System Design", "Backend", "Database", "React", "Security")
   - sampleAnswer (comprehensive STAR / technical architectural answer with trade-offs)
9. resources: array of 5-8 verified study resources with {{ "title": string, "url": string, "type": string, "category": string }}

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""

EVALUATE_SCENARIO_PROMPT = """You are a Senior Principal Engineer and Technical Interviewer evaluating a candidate's response to an engineering scenario.

CONCEPT / TOPIC: {concept_title}
ENGINEERING SCENARIO:
{scenario_text}

CANDIDATE'S PROPOSED SOLUTION:
{student_answer}

TARGET ROLE: {target_role} ({experience_level})

Evaluate the candidate's engineering reasoning thoroughly.
Do NOT just say "Correct". Teach the student how an experienced Staff/Principal Engineer would reason through this problem.

Return a strictly valid JSON object with:
{{
  "overallScore": <integer 0-100>,
  "conceptUnderstanding": <integer 0-100>,
  "realWorldUnderstanding": <integer 0-100>,
  "engineeringReasoning": <integer 0-100>,
  "interviewReadiness": <integer 0-100>,
  "whatYouIdentified": [
    "<Key positive point 1 the candidate correctly caught>",
    "<Key positive point 2>"
  ],
  "whatToConsider": [
    "<Crucial edge case, trade-off, failure mode, or design requirement they missed (e.g. cache invalidation, race conditions, TTL, failover)>",
    "<Another critical consideration>"
  ],
  "seniorEngineerSolution": "<Comprehensive, structured explanation of how a Staff Engineer would solve and explain this scenario in an interview: Architecture -> Workflow -> Trade-offs -> Failure Handling>",
  "followUpQuestions": [
    "<Direct probing question challenging their specific choice>",
    "<Failure mode question>",
    "<Edge-case / scalability question>"
  ]
}}
"""

def clean_json(raw: str) -> str:
    """Strip markdown fences and leading/trailing whitespace."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()

def generate_prep_data(
    resume_text: str,
    jd_text: str,
    experience_level: str = "beginner",
    days_to_interview: int = 7
) -> dict:
    if not resume_text or not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume content is required.")
    if not jd_text or not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job Description content is required.")

    logger.info("Starting gap analysis and learning path generation using Groq API (keys 20-27)...")
    prompt = PROMPT_TEMPLATE.format(
        resume_text=resume_text[:7000],
        jd_text=jd_text[:4000],
        experience_level=experience_level or "beginner",
        days_to_interview=days_to_interview or 7
    )
    
    attempts = len(GROQ_KEYS) if GROQ_KEYS else 1
    last_error = None
    
    for attempt in range(attempts):
        try:
            client = get_groq_client()
            logger.info(f"Sending request to Groq API with model openai/gpt-oss-120b (attempt {attempt + 1}/{attempts})...")
            
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a Principal Software Architect, Senior Technical Interviewer, and Executive Technical Recruiter. Output pure valid JSON strictly matching all requested fields without any markdown wrapping."},
                    {"role": "user", "content": prompt}
                ],
                model="openai/gpt-oss-120b",
                temperature=0.2,
                max_tokens=7000,
                response_format={"type": "json_object"}
            )
            
            raw = response.choices[0].message.content or ""
            if not raw.strip():
                raise ValueError("Groq returned empty response body")
            
            cleaned = clean_json(raw)
            data = json.loads(cleaned)
            logger.info("Successfully parsed Groq AI gap analysis response")
            
            # Ensure chapters are synced from learningTracks for legacy compatibility
            if not data.get("chapters") and data.get("learningTracks"):
                data["chapters"] = [
                    {
                        "id": f"chapter-{i+1}",
                        "title": t.get("trackTitle", f"Track {i+1}"),
                        "description": t.get("description", ""),
                        "skills": [],
                        "modules": [{"title": m.get("title", ""), "completed": False} for m in t.get("modules", [])]
                    }
                    for i, t in enumerate(data.get("learningTracks", []))
                ]
            
            # If for some reason interviewQuestions was skipped by the LLM, generate them directly
            if not data.get("interviewQuestions") or len(data.get("interviewQuestions", [])) == 0:
                logger.info("Generating interview questions in secondary prompt pass...")
                q_prompt = f"""Based on these identified missing skills: {json.dumps(data.get('focusAreas', []))} and JD: {jd_text[:1000]}, generate 6 technical interview questions with category, difficulty (easy|medium|hard), and detailed sampleAnswer. Return JSON with key "interviewQuestions"."""
                q_resp = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "Output pure JSON only."},
                        {"role": "user", "content": q_prompt}
                    ],
                    model="openai/gpt-oss-120b",
                    max_tokens=3000,
                    response_format={"type": "json_object"}
                )
                q_data = json.loads(clean_json(q_resp.choices[0].message.content or "{}"))
                if q_data.get("interviewQuestions"):
                    data["interviewQuestions"] = q_data["interviewQuestions"]

            return data
        except Exception as e:
            logger.error(f"Groq API attempt {attempt + 1} failed: {e}")
            last_error = e
            continue
            
    logger.error(f"All Groq API rotation attempts failed: {last_error}")
    raise HTTPException(
        status_code=502, 
        detail=f"Groq AI Generation failed across all configured API keys (GROQ_API_KEY_20 to 27): {str(last_error)}"
    )

# ── API Models ───────────────────────────────────────────────────────────────

class AnalyzeTextRequest(BaseModel):
    resume_text: str
    job_description: str
    experience_level: Optional[str] = "beginner"
    days_to_interview: Optional[int] = 7

class EvaluateScenarioRequest(BaseModel):
    concept_title: str
    scenario_text: str
    student_answer: str
    experience_level: Optional[str] = "intermediate"
    target_role: Optional[str] = "Software Engineer"

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "model": "openai/gpt-oss-120b", 
        "provider": "groq", 
        "active_keys_pool": len(GROQ_KEYS),
        "keys_range": "GROQ_API_KEY_20 to GROQ_API_KEY_27"
    }

@app.post("/analyze-text")
async def analyze_text(req: AnalyzeTextRequest):
    if not req.resume_text or not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required. Please paste or upload your resume.")
    if not req.job_description or not req.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required. Please paste or upload the target job description.")
    
    return generate_prep_data(
        resume_text=req.resume_text.strip(),
        jd_text=req.job_description.strip(),
        experience_level=req.experience_level or "beginner",
        days_to_interview=req.days_to_interview or 7
    )

@app.post("/evaluate-scenario")
async def evaluate_scenario(req: EvaluateScenarioRequest):
    if not req.student_answer or not req.student_answer.strip():
        raise HTTPException(status_code=400, detail="Please provide your explanation/approach before submitting.")

    logger.info(f"Evaluating student engineering approach for concept: {req.concept_title}...")
    prompt = EVALUATE_SCENARIO_PROMPT.format(
        concept_title=req.concept_title,
        scenario_text=req.scenario_text,
        student_answer=req.student_answer.strip()[:3000],
        target_role=req.target_role or "Software Engineer",
        experience_level=req.experience_level or "intermediate"
    )

    attempts = len(GROQ_KEYS) if GROQ_KEYS else 1
    last_error = None

    for attempt in range(attempts):
        try:
            client = get_groq_client()
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a Principal Software Architect and Technical Interviewer. Output pure valid JSON strictly matching the requested evaluation schema."},
                    {"role": "user", "content": prompt}
                ],
                model="openai/gpt-oss-120b",
                temperature=0.2,
                max_tokens=2500,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content or ""
            data = json.loads(clean_json(raw))
            logger.info("Successfully generated AI scenario evaluation")
            return data
        except Exception as e:
            logger.error(f"Scenario evaluation attempt {attempt + 1} failed: {e}")
            last_error = e
            continue

    raise HTTPException(status_code=502, detail=f"Scenario evaluation failed: {str(last_error)}")

@app.post("/upload")
async def upload_file(
    file: Optional[UploadFile] = File(None),
    resume_text_form: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    experience_level: Optional[str] = Form("beginner"),
    days_to_interview: Optional[int] = Form(7)
):
    # Extract Resume text
    resume_text = ""
    if file and file.filename:
        allowed = {"pdf", "doc", "docx", "txt"}
        ext = (file.filename or "").lower().rsplit(".", 1)[-1]
        if ext not in allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported resume file type: {ext}. Use PDF, DOC, DOCX, or TXT.")
        save_path = UPLOAD_DIR / file.filename
        content = await file.read()
        save_path.write_bytes(content)
        resume_text = extract_text(save_path, file.filename)
    elif resume_text_form and resume_text_form.strip():
        resume_text = resume_text_form.strip()

    if not resume_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="Resume is required. Please upload a resume file (PDF/DOCX/TXT) or paste your resume text."
        )

    # Extract Job Description text
    jd_text = (job_description or "").strip()
    if jd_file and jd_file.filename:
        allowed = {"pdf", "doc", "docx", "txt"}
        jd_ext = (jd_file.filename or "").lower().rsplit(".", 1)[-1]
        if jd_ext in allowed:
            jd_save_path = UPLOAD_DIR / f"jd_{jd_file.filename}"
            jd_content = await jd_file.read()
            jd_save_path.write_bytes(jd_content)
            extracted_jd = extract_text(jd_save_path, jd_file.filename)
            if extracted_jd.strip():
                jd_text = f"{jd_text}\n\n{extracted_jd}".strip()

    if not jd_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="Job Description is required. Please paste or upload the target Job Description."
        )

    logger.info(f"Generating live gap analysis (Resume length: {len(resume_text)}, JD length: {len(jd_text)})...")
    return generate_prep_data(
        resume_text=resume_text,
        jd_text=jd_text,
        experience_level=experience_level or "beginner",
        days_to_interview=days_to_interview or 7
    )
