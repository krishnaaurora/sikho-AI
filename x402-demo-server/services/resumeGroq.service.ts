/**
 * resumeGroq.service.ts
 * ─────────────────────────────────────────────────────────────────
 * Dedicated Groq client pool for the Resume Intelligence pipeline.
 *
 * Architecture:
 *   - All available API keys in round-robin (no hardcap at 5)
 *   - Model fallback chain: tries primary model, then falls back through
 *     alternatives when the primary daily token quota is exhausted
 *   - Skips per-retry waits for TPD limits — rotates model immediately
 *   - Keys are NEVER logged, exposed in responses, or sent to the frontend
 */

import Groq from "groq-sdk";
import crypto from "crypto";
import { config } from "../config";

// ─── Types ────────────────────────────────────────────────────────
export interface ResumeGroqRequest {
  system: string;
  user: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

// ─── Key-slot state ───────────────────────────────────────────────
interface KeySlot {
  index: number;
  client: Groq;
  lastError: string | null;
}

// ─── Model fallback chain ─────────────────────────────────────────
// When the primary model hits its daily token limit (all keys same org = shared quota),
// we automatically try these alternatives in order.
const MODEL_FALLBACK_CHAIN: string[] = [
  "openai/gpt-oss-120b",       // primary — highest quality
  "qwen/qwen3.8-27b",          // fallback 1 
  "groq/compound",             // fallback 2
  "openai/gpt-oss-20b",        // fallback 3
  "qwen/qwen3.6-27b",          // fallback 4 — last resort
];

// ─── Initialise slots from config ─────────────────────────────────
function buildSlots(): KeySlot[] {
  const resumeKeys  = (config.groqResumeKeys  || []).filter(Boolean);
  const generalKeys = (config.groqApiKeys     || []).filter(Boolean);

  // Merge: resume keys first, then general, deduplicating
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const k of [...resumeKeys, ...generalKeys]) {
    if (k && !seen.has(k)) { seen.add(k); merged.push(k); }
  }

  if (merged.length === 0) {
    throw new Error("[ResumeGroq] No Groq API keys configured. Set GROQ_API_KEY_1..N in .env");
  }

  console.info(`[ResumeGroq] Initialized ${merged.length} key slots with ${MODEL_FALLBACK_CHAIN.length}-model fallback chain`);

  return merged.map((k, i) => ({
    index: i + 1,
    client: new Groq({ apiKey: k }),
    lastError: null,
  }));
}

const slots: KeySlot[] = buildSlots();
let roundRobinCursor = 0;

// ─── Simple response cache ────────────────────────────────────────
const responseCache = new Map<string, string>();

function getCacheKey(req: ResumeGroqRequest): string {
  const hash = crypto.createHash("sha256");
  hash.update(req.system || "");
  hash.update(req.user   || "");
  hash.update(String(req.maxTokens   || 4096));
  hash.update(String(req.temperature || 0.3));
  hash.update(req.jsonMode ? "json" : "text");
  return hash.digest("hex");
}

// ─── Try a single model+slot combination ─────────────────────────
async function trySlotWithModel(slot: KeySlot, model: string, req: ResumeGroqRequest): Promise<string | null> {
  try {
    console.info(`[ResumeGroq] Trying key slot ${slot.index} model ${model}`);
    const completion = await slot.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: req.system },
        { role: "user",   content: req.user   },
      ],
      temperature: req.temperature ?? 0.3,
      max_tokens:  req.maxTokens   ?? 1024,
      ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty response from Groq");
    slot.lastError = null;
    return text;
  } catch (err: any) {
    slot.lastError = err?.message ?? String(err);
    return null;
  }
}

// ─── Core chat completion: try each model, rotating all keys ─────
export async function resumeGroqChat(req: ResumeGroqRequest): Promise<string> {
  const cacheKey = getCacheKey(req);
  if (responseCache.has(cacheKey)) {
    console.info("[ResumeGroq] Cache hit! Returning cached completion.");
    return responseCache.get(cacheKey)!;
  }

  const primaryModel = config.groqResumeModel || MODEL_FALLBACK_CHAIN[0];
  const modelChain   = [primaryModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== primaryModel)];

  const startIdx = roundRobinCursor % slots.length;
  const allErrors: string[] = [];

  for (const model of modelChain) {
    let allTpd = true; // tracks if every key returned a daily-limit error for this model

    for (let attempt = 0; attempt < slots.length; attempt++) {
      const slotIdx = (startIdx + attempt) % slots.length;
      const slot    = slots[slotIdx];

      const result = await trySlotWithModel(slot, model, req);

      if (result !== null) {
        responseCache.set(cacheKey, result);
        roundRobinCursor = (slotIdx + 1) % slots.length;
        console.info(`[ResumeGroq] ✓ Success: key slot ${slot.index}, model ${model}`);
        return result;
      }

      const errMsg        = slot.lastError ?? "";
      const isTpd         = errMsg.includes("tokens per day") || errMsg.includes("TPD");
      const isModelGone   = errMsg.includes("model_not_found") || errMsg.includes("does not exist") || errMsg.includes("decommissioned");

      allErrors.push(`slot ${slot.index} / ${model}: ${errMsg.slice(0, 100)}`);

      if (isModelGone) {
        console.warn(`[ResumeGroq] Model ${model} unavailable — skipping to next model`);
        allTpd = true;
        break;
      }

      if (!isTpd) {
        allTpd = false;
        // Per-minute rate limit or other error — brief pause then try next key
        await new Promise(r => setTimeout(r, 500));
      }
      // TPD limit → just rotate key immediately (waiting won't help for 37+ minutes)
    }

    console.warn(`[ResumeGroq] All ${slots.length} key slots failed for model ${model} — trying next model`);
  }

  // All models and keys exhausted
  throw new Error(
    `[ResumeGroq] All ${slots.length} key slots and ${modelChain.length} models exhausted.\n` +
    `Models tried: ${modelChain.join(", ")}\n` +
    `First errors:\n${allErrors.slice(0, 6).join("\n")}`
  );
}

// ─── Convenience: parse JSON from the response safely ────────────
export async function resumeGroqJson<T = Record<string, unknown>>(req: ResumeGroqRequest): Promise<T> {
  const raw = await resumeGroqChat({ ...req, jsonMode: true });
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Expose current slot health for logging (no keys) ────────────
export function getResumeGroqHealth(): { slot: number; lastError: string | null }[] {
  return slots.map(s => ({ slot: s.index, lastError: s.lastError }));
}

