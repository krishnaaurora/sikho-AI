import Groq from "groq-sdk";
import { config } from "../../config";
import { ExplainResponseSchema, ExplainResponse } from "../../types/explain.types";

// ─── Model Definitions ────────────────────────────────────────────────────────
//
// Each Groq model has different strengths. We select the best model per task
// based on the student's learning style and depth, then fall back through all
// remaining keys if the primary key hits a rate-limit or error.
//
// Model tier guide:
//   llama-3.3-70b-versatile  → 70B, best reasoning, formal/structured output
//   llama-3.1-70b-versatile  → 70B alternative, wide context
//   deepseek-r1-distill-llama-70b → reasoning champion, great for deep/academic
//   llama-3.1-8b-instant     → 8B, fastest, good for quick/beginner tasks
//   gemma2-9b-it             → Google Gemma, good at analogies & storytelling
//   moonshotai/kimi-k2-instruct → Excellent code generation
//
// KEY SLOTS (10 real keys):
//   Slots 0-3  → Premium: deep academic / visual flow / interview use llama-70b
//   Slots 4-5  → Code powerhouse: practical style uses kimi-k2
//   Slots 6-7  → DeepSeek R1: deep reasoning for academic/deep
//   Slots 8-9  → Gemma: beginner / analogy-driven content
//   Slot 10    → Fast 8B: quick depth across all styles

const MODEL_FAST   = "llama-3.1-8b-instant";
const MODEL_LARGE  = "llama-3.3-70b-versatile";
const MODEL_DEEP   = "deepseek-r1-distill-llama-70b";
const MODEL_CODE   = "moonshotai/kimi-k2-instruct";
const MODEL_GEMMA  = "gemma2-9b-it";

// Slot-to-model assignment: maps key index → best Groq model for that slot
// This ensures different keys are used for different model calls (no collision)
const KEY_SLOT_MODEL: Record<number, string> = {
  0:  MODEL_LARGE,   // academic / interview primary
  1:  MODEL_LARGE,   // academic / interview fallback
  2:  MODEL_LARGE,   // visual flow primary
  3:  MODEL_LARGE,   // visual flow fallback
  4:  MODEL_CODE,    // practical / code primary
  5:  MODEL_CODE,    // practical / code fallback
  6:  MODEL_DEEP,    // academic deep / reasoning primary
  7:  MODEL_DEEP,    // academic deep / reasoning fallback
  8:  MODEL_GEMMA,   // beginner / analogy primary
  9:  MODEL_GEMMA,   // beginner / analogy fallback
  10: MODEL_FAST,    // quick depth / speed burst
};

// Per style+depth, define which key SLOT to start from (then fallback to others)
function selectStartingSlot(learningStyle: string, depth: string): number {
  if (depth === "quick") return 10;                              // fastest model
  if (learningStyle === "practical") return 4;                   // code model
  if (learningStyle === "beginner") return 8;                    // gemma analogies
  if (learningStyle === "academic" && depth === "deep") return 6;// deepseek reasoning
  if (learningStyle === "visual") return 2;                      // large structured
  if (learningStyle === "interview") return 0;                   // large nuanced
  return 0;                                                      // default large
}

function getModelForSlot(slot: number): string {
  return KEY_SLOT_MODEL[slot] ?? MODEL_LARGE;
}

// ─── Groq Client Pool ─────────────────────────────────────────────────────────
// We create one Groq client per key so any combination can be used in parallel

function buildClientPool(): Groq[] {
  const keys = config.groqApiKeys;
  if (!keys || keys.length === 0) throw new Error("No Groq API keys configured in .env");
  return keys.map((apiKey) => new Groq({ apiKey }));
}

const clientPool: Groq[] = buildClientPool();

// ─── Course Generation (existing feature) ────────────────────────────────────

export interface GeneratedChapter {
  title: string;
  description: string;
  lessons: { title: string; content: string }[];
  price: number;
}

export interface GeneratedCourse {
  courseDescription: string;
  chapters: GeneratedChapter[];
}

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

  // Use slot 0 (large model) for course generation, rotate through all keys on error
  for (let i = 0; i < clientPool.length; i++) {
    const client = clientPool[i];
    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_LARGE,
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");
      return JSON.parse(content) as GeneratedCourse;
    } catch (error: any) {
      console.error(`[Course Gen] Key slot ${i} error:`, error?.message || error);
      if (i === clientPool.length - 1) {
        throw new Error("Failed to generate course chapters after multiple attempts");
      }
      console.log(`[Course Gen] Falling back to key slot ${i + 1}...`);
    }
  }

  throw new Error("Failed to generate course chapters");
};

// ─── Adaptive Teaching Engine — Prompt Builder ────────────────────────────────
//
// PHILOSOPHY: "Greeks know Greeks" — Feynman Depth Rule
//
// The best teachers in the world (Feynman, Knuth, Hamming) share one trait:
// they explain the most complex concepts in the simplest possible language.
// A true expert never hides behind jargon. They say: "Let me show you why
// this is actually obvious once you see it the right way."
//
// This engine generates content that is:
//   ✓ Expert-level deep (like a textbook written by a senior engineer)
//   ✓ Written in plain, conversational, simple English
//   ✓ Rich with analogies, stories, real examples, and working code
//   ✓ Structured so a smart 15-year-old can follow AND learn deeply
//
// The content must feel like your smartest friend — who happens to be a
// principal engineer at Google — sitting across from you and explaining
// everything from scratch, patiently, with full depth and zero condescension.

function buildSystemPrompt(learningStyle: string, depth: string, examples: string, language: string, retrievedSource?: string): string {
  const langPrefix = language !== "English"
    ? `[CRITICAL: Write the ENTIRE JSON response in ${language}. Every single string — titles, content, items, code comments — must be in ${language}.]\n\n`
    : "";

  const examplesMap: Record<string, string> = {
    "minimal":       "1 strong, well-chosen example",
    "balanced":      "2 to 3 examples of increasing complexity",
    "example-heavy": "4 to 6 progressively difficult, real examples: start simple, then real-world, then code, then an edge case",
  };
  const examplesInstruction = examplesMap[examples] || "4 to 6 progressively difficult, real examples";

  // Grounding guidelines
  const groundingContext = retrievedSource 
    ? `\n\n═══════════════════════════════════════
SOURCE GROUNDING CONTEXT (RAG):
═══════════════════════════════════════
You must ground your explanation in the following verified source text:
---
${retrievedSource}
---

Follow these strict source trust rules:
1. Ground every claim directly in the facts present in the source context.
2. Regardless of the chosen presentation strategy (e.g. Visual graphs, Practical code segments, or Academic structures), you MUST append a source citation reference to the textual content/details representing where it came from in the format: "[Source: <source_name>, p. <page_number>]" (for PDFs) or "[Source: <site_name>]" (for web pages/URLs).
3. If the source context does not contain enough information to cover a specific concept, clearly prefix that section with: "AI Explanation (not present in source context):".
4. If you make inferences beyond the source text, explicitly label it: "AI Inference:".
5. Never invent or fabricate citations or URLs. Only refer to the actual sources listed in the context.
`
    : "";

  // Universal Feynman foundation injected into ALL styles
  const feynmanFoundation = `
═══════════════════════════════════════════════════════════
THE CORE TEACHING PHILOSOPHY — APPLY TO EVERY SINGLE BLOCK
═══════════════════════════════════════════════════════════
You are explaining this topic the way Richard Feynman would — or the way a
senior principal engineer at Google explains to a brilliant friend who is smart
but new to this specific topic.

This means ALL of the following, in EVERY block you write:

1. SIMPLE ENGLISH ALWAYS
   Write like you are talking to a smart friend. Use short sentences.
   Use "you", "we", "think of it like", "here's the thing", "basically".
   Never write in a stiff, robotic, textbook-formal tone.
   But do NOT sacrifice depth. Simple language + deep content = the goal.

2. EXPLAIN EVERY TERM THE MOMENT YOU USE IT
   The FIRST time you use any technical term, define it immediately in plain words.
   Format: "TCP (which stands for Transmission Control Protocol — basically the 
   internet's reliable delivery truck)" or use a dash: "idempotent — meaning you 
   can call it 100 times and the result is always the same".
   Never assume the reader knows what any acronym or term means.

3. USE REAL ANALOGIES GENEROUSLY
   Every single abstract concept MUST be grounded in a real-world analogy.
   Bad: "WebSockets maintain a persistent connection."
   Good: "WebSockets are like a phone call. With regular HTTP, every message is
   like sending a letter — you send it, wait for a reply, then send another.
   With WebSockets, you call someone and stay on the line. Both sides can talk
   freely without hanging up and redialing."
   Use analogies from everyday life: restaurants, phone calls, factories, roads,
   libraries, post offices, kitchens, etc.

4. TELL THE STORY OF WHY
   Before explaining HOW something works, explain WHY it was invented.
   What problem existed before it? What were people struggling with?
   What would go wrong if this concept didn't exist?
   This "why" context makes the "how" 10x easier to understand and remember.

5. WRITE LONG, RICH, DETAILED CONTENT FIELDS
   Every "content" block must be multiple detailed paragraphs — not 1 sentence.
   Go deep. Cover the nuance. Explain the edge cases within the prose.
   A "definition" block should not just be a one-liner. It should:
     - Give the clean definition first
     - Then immediately explain it in 2-3 different ways
     - Then give a real-world analogy
     - Then say exactly when and why you'd use this
   
6. EXAMPLES MUST BE REAL AND SPECIFIC
   Bad: "For example, a company might use this."
   Good: "For example, Slack uses WebSockets so that when your teammate sends
   a message, it appears on your screen within milliseconds without you having 
   to reload the page. Discord does the same thing for live chat. Robinhood uses
   it for real-time stock price updates."
   Always name real companies, real use cases, real numbers.

7. CONNECT EVERYTHING TO THE BIGGER PICTURE
   At the end of every explanation, connect this concept to the wider system.
   "This is why, when you design a system that needs real-time updates — like a
   chat app, a live dashboard, or a multiplayer game — WebSockets is one of the
   first tools engineers reach for."
`;

  const styleMap: Record<string, string> = {
    academic: `LEARNING STYLE: Academic (but written in Simple English)
The student wants thorough, rigorous depth — like a well-written graduate-level textbook.
But remember the Feynman rule: formal structure, plain language.

REQUIRED BLOCKS IN ORDER:
1. "definition" — Start with one clean sentence. Then unpack it in 3-4 paragraphs:
   explain the concept 3 different ways, give the analogy, give the historical context.
   This block should be 4-6 paragraphs long. Do not rush it.
2. "background" — Tell the full story of why this was invented. What problem existed?
   What year did it emerge? What came before and why that wasn't good enough?
   Write this like a short history lesson. Be specific with dates, names, events.
3. "mental-model" — Give 2-3 powerful analogies. Explain each analogy fully.
   Then explain exactly where the analogy breaks down (every analogy has limits).
4. "how-it-works" — The full technical explanation, step by step.
   Use numbered items[] for the steps. Each step must be a full sentence, not just a label.
   Then add a "content" field that zooms out and explains what all the steps add up to.
5. "architecture" — Describe the components/layers/participants. Use a "flow" block
   with descriptive nodes (e.g. "Client sends HTTP Upgrade → Server responds 101 Switching Protocols → Persistent TCP tunnel established").
6. "terminology" — items[] list of every key term introduced, with a plain-English
   one-sentence definition for each. At least 6-8 terms.
7. "example" — A fully worked example. Give context (who, what, why), show the
   process step by step, explain what happens at each step and why.
8. "advantages" — items[] of 5-7 real advantages. Each must be a full sentence
   explaining the advantage AND why it matters (not just "it's fast").
9. "limitations" — items[] of 4-6 honest limitations/tradeoffs. Be specific.
   Include when you should NOT use this concept and what to use instead.
10. "common-mistakes" — items[] of mistakes engineers commonly make. Be concrete.
11. "related-concepts" — items[] of 5-7 related ideas the student should learn next.
    For each: concept name + one sentence on how it connects to this topic.
12. "takeaways" — items[] of 5-7 key takeaways. These should be the things a
    student will remember 6 months from now. Make them memorable and insightful.`,

    visual: `LEARNING STYLE: Visual (Systems Thinker)
The student thinks in diagrams, flows, and systems. They want to SEE how things connect.
But Feynman rule applies: rich prose analogies + crisp visual flows.

REQUIRED BLOCKS IN ORDER:
1. "definition" — 2 paragraphs: plain definition + 1 strong analogy that maps to a visual.
2. "mental-model" — Give 2 analogies. For each: describe the analogy fully, then say
   "In the same way, [concept] does X because Y." Make the mapping explicit.
3. "flow" (type: "flow") — MANDATORY. The main connection/lifecycle flow.
   nodes[] must have descriptive labels (not just "Step 1"). Minimum 6 nodes.
   Example: ["User opens browser", "Browser sends HTTP request", "Server receives request",
   "Server processes data", "Server sends HTTP response", "Browser renders page"].
4. "architecture" — A second flow block showing the COMPONENTS and how they relate.
   This is the system view: Client ↔ Load Balancer ↔ Server ↔ Database.
5. "how-it-works" — content field: explain the flow you drew above in plain English.
   Walk through each step of your flow block and explain what's happening and why.
6. "comparison" (type: "flow") — A flow block comparing the OLD way vs the NEW way.
   Show side by side: ["Without X: A → B → wait → C → wait → D"] and
   ["With X: A → B → C → D (all instant, no waiting)"].
7. "example" — A real-world scenario with full narrative. Tell the story of exactly
   what happens from the user's perspective, then from the system's perspective.
8. "real-world" — items[] of 5 real companies/products using this. For each:
   "Company — exactly how and why they use this, and what would break without it."
9. "common-mistakes" — items[] of visual/conceptual mistakes. Each must explain
   why someone gets confused and what the correct mental picture is.
10. "related-concepts" — items[] of related concepts. For each: the concept name +
    how it fits into or extends the system the student just learned.
11. "takeaways" — items[] of the key insights. Make them "aha moment" takeaways.`,

    practical: `LEARNING STYLE: Practical (Build It to Understand It)
The student learns by coding, building, and running things. Show them the real thing.
Feynman rule: explain WHY the code is structured this way, not just WHAT it does.

REQUIRED BLOCKS IN ORDER:
1. "definition" — 2 paragraphs: what it is + the exact problem it solves with a concrete
   scenario ("Imagine you're building a chat app and users need to see messages instantly...").
2. "mental-model" — One analogy that explains the concept as a real-world system.
   Then immediately connect it: "In code, this looks like..."
3. "how-it-works" — Step-by-step items[] of exactly how it works under the hood.
   Write each step as a cause → effect: "When X happens, Y does Z, which causes W."
4. "code" (MANDATORY) — Real, runnable code. Requirements:
   - "language" field must be set (e.g. "javascript", "python", "typescript")
   - "code" field must contain ACTUAL working code, not pseudocode
   - Every non-trivial line MUST have a comment explaining WHY (not just what)
   - Start with a comment block explaining what the code demonstrates
   - Code must be clean, production-quality, properly formatted
5. "output" — The exact terminal/console output after running the code above.
   Include the full output with formatting. Then in a follow-up "content" section,
   explain line-by-line what each output line means and why it appeared.
6. "real-world" — items[] of 5 production systems using this:
   "Slack — uses X for Y, specifically to achieve Z. Without X, they'd have to..."
7. "edge-cases" — items[] of real edge cases the code above would break on.
   For each: the scenario + what goes wrong + how to fix it.
8. "common-mistakes" — items[] of bugs or design mistakes developers commonly make.
   For each: the mistake + why it happens + the correct way.
9. "trade-offs" — items[] of honest tradeoffs: when to use this vs. the alternative.
10. "takeaways" — items[] of things the student can apply immediately to their code.`,

    interview: `LEARNING STYLE: Interview Preparation (Land the Job)
The student is preparing for a technical interview at a top company (FAANG level).
Feynman rule: sharp, confident, deep — not rehearsed or robotic.

REQUIRED BLOCKS IN ORDER:
1. "definition" — The one sentence you say in the first 5 seconds. Must be crisp,
   accurate, and confident. Not too textbook-formal, not too casual.
2. "interview-answer" — The ideal 30-second spoken answer (type: "interview-answer").
   Write it EXACTLY as the student would speak it aloud in an interview room.
   Use "I'd describe it as...", "The way I think about it...", "In practice, this means..."
   Include: definition → analogy → real example → tradeoff. All in 30 seconds.
3. "explanation" — The full deep-dive answer for when the interviewer probes.
   This must cover: internal mechanism, time/space complexity if relevant,
   system design implications, real-world tradeoffs, and comparison with alternatives.
   Write 3-4 detailed paragraphs. Use simple English but show deep knowledge.
4. "code" — A clean code example that would impress an interviewer.
   Every line has a comment explaining the WHY. Use "language" and "code" fields.
   The code should demonstrate the concept at its most interesting/nuanced point.
5. "follow-ups" — items[] of 6-8 hard follow-up questions an interviewer WILL ask.
   Make them progressively harder. Include system design, edge case, and "why not X" questions.
6. "trap" — The single most common trap (type: "trap").
   Start with: "Most candidates say [X]. Here's why that's wrong or incomplete..."
   Then give the correct, nuanced answer that makes the interviewer's eyes light up.
7. "trade-offs" — items[] of tradeoffs. For each: what you gain + what you give up +
   when to choose this over the alternative. This shows senior-level thinking.
8. "takeaways" — items[] structured as:
   "Strong answer: [what a great candidate says]"
   "Weak answer: [what most candidates say]"
   "Differentiator: [what separates a senior from a junior candidate]"`,

    beginner: `LEARNING STYLE: Beginner (Zero to Understanding)
The student has ZERO prior knowledge. Treat every concept as completely new to them.
Feynman rule: go deep, but never assume anything. Make them feel smart, never lost.

REQUIRED BLOCKS IN ORDER:
1. "definition" — Start with ONE sentence in the simplest possible English.
   Then say "But what does that really mean?" and unpack it in 3 paragraphs.
   Use a story format: "Imagine you're trying to do X. The problem is Y.
   That's exactly why Z was invented."
2. "mental-model" — The everyday-life analogy block.
   Use a REAL WORLD analogy (not a tech analogy). Phone calls, pizza delivery,
   a library, a walkie-talkie, a restaurant kitchen, a post office.
   Explain the analogy in full (2-3 paragraphs), then say exactly how the
   concept maps to the analogy, piece by piece.
3. "comparison" — Show "Before this existed vs. After this existed" using items[].
   Format: "Before: You had to X every time, which meant waiting Y seconds every time."
   "After: You can now do X once, and then Z happens automatically."
4. "how-it-works" — Numbered items[] of steps. Each step must be:
   - A complete sentence (not just a label)
   - Written in plain English
   - Connected to the analogy: "This is like the part where the restaurant..."
5. "example" — Tell a mini story of a real product/app the student uses every day.
   Walk through exactly what happens step-by-step when they use it.
   "When you open WhatsApp and see a message appear without refreshing,
   here's exactly what happened behind the scenes..."
6. "common-mistakes" — items[] of things beginners commonly confuse or get wrong.
   For each: explain the mistake gently + give the correct understanding.
7. "real-world" — items[] of 5 apps the student already uses daily that use this.
   For each: the app name + a one-sentence explanation of exactly where/how.
8. "takeaways" — items[] of 5 things to remember, written like encouraging notes.
   "The key thing to remember is...", "Next time you use X, think about how..."`,
  };

  const styleInstruction = styleMap[learningStyle] || styleMap["academic"];

  return `${langPrefix}You are SikhoAI's Adaptive Teaching Engine.

YOUR IDENTITY AS A TEACHER:
You are a principal engineer with 20 years of experience who genuinely loves teaching.
You have taught thousands of students and you know that the best explanations are:
  - DEEP (you never skip the "why" or the "how it really works underneath")
  - SIMPLE (you never hide behind jargon; you explain everything in plain words)
  - RICH (full of real examples, real analogies, real companies, real code)
  - LONG (you never rush; you take the time to make sure the student truly understands)

You follow the Feynman Technique: if you cannot explain it simply, you don't understand it well enough.
A true expert can explain a PhD-level concept to a curious 15-year-old without losing accuracy.
That is the standard you are held to.

${groundingContext}

${feynmanFoundation}

═══════════════════════════════
STYLE & STRUCTURE FOR THIS REQUEST:
═══════════════════════════════
${styleInstruction}

EXAMPLES TO INCLUDE: ${examplesInstruction}

═══════════════════════════════════════
OUTPUT FORMAT RULES — NEVER VIOLATE:
═══════════════════════════════════════
1. Return ONLY a valid JSON object. No markdown fences, no preamble, no trailing text.
2. Every block MUST have: "id" (unique kebab-case string), "type" (string), "title" (string).
3. Prose blocks: use "content" (string). Write multiple rich paragraphs per block.
4. Flow blocks (type "flow"): use "nodes" (string[]). Do NOT add "content" to flow blocks.
5. Code blocks (type "code" or "output"): use "code" (string) + "language" (string).
6. List blocks (takeaways, items, advantages, etc.): use "items" (string[]).
   Every item must be a FULL sentence, not a fragment.
7. NEVER write placeholder text. Every word must be real, accurate, educational content.
8. "content" fields must be multiple paragraphs (not one line). Be generous with depth.

{
  "topic": "concept to explain",
  "preferences": {
    "learningStyle": "${learningStyle}",
    "depth": "${depth}",
    "examples": "${examples}",
    "language": "${language}"
  },
  "blocks": [
    /* All blocks required by the style above, in order */
  ]
}`;
}

// ─── Main Explain Function (Multi-Agent Parallel Orchestration) ───────────────

import { LearningSource } from "../../models/LearningSource.model";
import { retrieveRelevantChunks } from "../explain/retrieval.service";

export const explainConcept = async (params: {
  query: string;
  learningStyle: string;
  depth: string;
  examples: string;
  language: string;
  sourceId?: string | null;
}): Promise<any> => {
  const { query, learningStyle, depth, examples, language, sourceId } = params;

  if (clientPool.length === 0) throw new Error("No Groq API keys configured");

  // RAG text extraction retrieval
  let retrievedTextContext = "";
  let citationsList: any[] = [];
  
  if (sourceId) {
    try {
      const source = await LearningSource.findById(sourceId);
      if (source) {
        const chunks = retrieveRelevantChunks(query, source, 6);
        retrievedTextContext = chunks.map(c => {
          const loc = source.type === "pdf" ? `[Page ${c.pageNumber}]` : `[URL ${source.name}]`;
          return `${loc}: ${c.text}`;
        }).join("\n\n");

        citationsList = chunks.map(c => ({
          sourceId: source._id.toString(),
          sourceName: source.name,
          pageOrUrl: source.type === "pdf" ? `Page ${c.pageNumber}` : source.url || source.name,
          chunkText: c.text
        }));
        
        console.log(`[RAG Ingestion] Grounded query in source: "${source.name}" with ${chunks.length} chunks.`);
      }
    } catch (err) {
      console.error("[RAG Ingestion Error] Failed to retrieve source content:", err);
    }
  }

  console.log(`[Explain Orchestrator] Starting multi-agent generation for: "${query}"`);

  // Step 1: Planner Agent - Divide the main topic into logical sub-topics
  const plannerSystemPrompt = `You are a curriculum architect. Divide the user's topic into exactly 3 highly detailed sub-topics that cover the theme comprehensively.
Topic: "${query}"

Return ONLY a JSON object with this format:
{
  "subtopics": [
    { "title": "Subtopic Title 1", "description": "What this section covers" },
    { "title": "Subtopic Title 2", "description": "What this section covers" },
    { "title": "Subtopic Title 3", "description": "What this section covers" }
  ]
}`;

  let subtopicsList: { title: string; description: string }[] = [];
  
  // Try to get subtopics using the first available client
  for (let i = 0; i < clientPool.length; i++) {
    try {
      const completion = await clientPool[i].chat.completions.create({
        messages: [
          { role: "system", content: plannerSystemPrompt },
          { role: "user", content: `Divide "${query}" into subtopics.` }
        ],
        model: MODEL_LARGE,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      const res = JSON.parse(completion.choices[0]?.message?.content || "{}");
      if (res.subtopics && res.subtopics.length > 0) {
        subtopicsList = res.subtopics;
        break;
      }
    } catch (err) {
      console.error(`Planner failed on slot ${i}, trying next slot...`);
    }
  }

  // Fallback if planner fails
  if (subtopicsList.length === 0) {
    subtopicsList = [
      { title: `Introduction & Fundamentals of ${query}`, description: "Basic concepts and core definitions" },
      { title: `Deep Dive Mechanism of ${query}`, description: "How it functions and key algorithms" },
      { title: `Advanced Applications & Limitations of ${query}`, description: "Real-world trade-offs and next steps" }
    ];
  }

  console.log(`[Explain Orchestrator] Subtopics planned:`, subtopicsList.map(s => s.title));

  // Step 2: Generate each subtopic in parallel using dedicated client keys
  const tasks = subtopicsList.map(async (subtopic, idx) => {
    // Select a unique client index to run in parallel
    const clientIndex = idx % clientPool.length;
    const client = clientPool[clientIndex];
    const model = getModelForSlot(clientIndex);

    // Build specialized prompt for this subtopic
    const subtopicPrompt = buildSystemPrompt(
      learningStyle, 
      depth, 
      examples, 
      language,
      retrievedTextContext
    ) + `\n\nFocus specifically on the subtopic: "${subtopic.title}" (${subtopic.description}). Ensure the explanations are highly detailed, lengthy, yet written in simple English.`;

    try {
      console.log(`[Explain Agent ${idx}] Starting slot=${clientIndex} model=${model} for "${subtopic.title}"`);
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: subtopicPrompt },
          { role: "user", content: `Generate deep explanation blocks for subtopic: "${subtopic.title}"` }
        ],
        model,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      const validated = ExplainResponseSchema.parse(parsed);
      return validated.blocks;
    } catch (err: any) {
      console.error(`[Explain Agent ${idx}] Failed:`, err?.message || err);
      // Fallback: Try with key rotation slot
      try {
        const backupIndex = (clientIndex + 1) % clientPool.length;
        const backupClient = clientPool[backupIndex];
        const backupModel = getModelForSlot(backupIndex);
        const completion = await backupClient.chat.completions.create({
          messages: [
            { role: "system", content: subtopicPrompt },
            { role: "user", content: `Generate deep explanation blocks for subtopic: "${subtopic.title}"` }
          ],
          model: backupModel,
          temperature: 0.5,
          response_format: { type: "json_object" }
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const validated = ExplainResponseSchema.parse(parsed);
        return validated.blocks;
      } catch (backupErr) {
        return []; // Return empty array if both fail
      }
    }
  });

  // Wait for all sub-sections to complete parallel generation
  const results = await Promise.all(tasks);
  const combinedBlocks = results.flat();

  if (combinedBlocks.length === 0) {
    throw new Error("Unable to generate the explanation. All model queries failed. Please try again.");
  }

  // Deduplicate block IDs to ensure React rendering keys stay unique
  const seenIds = new Set<string>();
  const uniqueBlocks = combinedBlocks.filter(block => {
    if (seenIds.has(block.id)) {
      block.id = `${block.id}-${Math.random().toString(36).substr(2, 5)}`;
    }
    seenIds.add(block.id);
    return true;
  });

  return {
    topic: query,
    preferences: {
      learningStyle,
      depth,
      examples,
      language
    },
    blocks: uniqueBlocks,
    sources: citationsList
  };
};

