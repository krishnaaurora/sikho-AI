/**
 * resumeGroq.service.ts
 * ─────────────────────────────────────────────────────────────────
 * Dedicated Groq client pool for the Resume Intelligence pipeline.
 *
 * Architecture:
 *   - 5 exclusive API keys (GROQ_RESUME_KEY_1 … GROQ_RESUME_KEY_5)
 *   - Round-robin key selection with automatic failover on 429 / 5xx
 *   - Per-key model availability cache (checked once per process lifetime)
 *   - Maximum 5 attempts per request (one per key slot)
 *   - Keys are NEVER logged, exposed in responses, or sent to the frontend
 *
 * Usage:
 *   import { resumeGroqChat } from "./resumeGroq.service";
 *
 *   const text = await resumeGroqChat({
 *     system: "You are …",
 *     user:   "Analyse this resume …",
 *     jsonMode: true,      // optional — sets response_format: json_object
 *     maxTokens: 4096,     // optional
 *   });
 */

import Groq from "groq-sdk";
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
  index: number;               // 1-based slot label (never exposed externally)
  client: Groq;
  modelAvailable: boolean | null; // null = not yet checked
  lastError: string | null;
}

// ─── Initialise slots from config ─────────────────────────────────
function buildSlots(): KeySlot[] {
  const keys = (config.groqResumeKeys || []).filter(Boolean);

  if (keys.length === 0) {
    // Graceful fallback: try the general pool so the server still starts
    const fallback = (config.groqApiKeys || []).filter(Boolean).slice(0, 5);
    if (fallback.length === 0) {
      throw new Error("[ResumeGroq] No Groq API keys configured. Set GROQ_RESUME_KEY_1..5 in .env");
    }
    console.warn("[ResumeGroq] GROQ_RESUME_KEY_1..5 not set — falling back to general pool (first 5 keys)");
    return fallback.map((k, i) => ({
      index: i + 1,
      client: new Groq({ apiKey: k }),
      modelAvailable: null,
      lastError: null,
    }));
  }

  return keys.map((k, i) => ({
    index: i + 1,
    client: new Groq({ apiKey: k }),
    modelAvailable: null,
    lastError: null,
  }));
}

const slots: KeySlot[] = buildSlots();
let roundRobinCursor = 0; // wraps around slot count

// ─── Model availability check (once per process, per slot) ───────
async function checkModelAvailability(slot: KeySlot): Promise<boolean> {
  if (slot.modelAvailable !== null) return slot.modelAvailable;

  const model = config.groqResumeModel;
  try {
    // Groq SDK exposes models.list() — use it to verify the model ID exists
    const list = await slot.client.models.list();
    const found = list.data.some((m: any) => m.id === model);
    slot.modelAvailable = found;
    if (!found) {
      console.warn(`[ResumeGroq] Key slot ${slot.index}: model "${model}" NOT found in available models list`);
    } else {
      console.info(`[ResumeGroq] Key slot ${slot.index}: model "${model}" confirmed available`);
    }
    return found;
  } catch (err: any) {
    // If the models endpoint itself fails (auth error, network), mark unknown → allow attempt
    console.warn(`[ResumeGroq] Key slot ${slot.index}: could not verify model availability — ${err.message}`);
    slot.modelAvailable = true; // optimistically allow; real errors will surface on the chat call
    return true;
  }
}

// ─── Determine if an error warrants trying the next key ──────────
function isRetryableError(err: any): boolean {
  const status: number = err?.status ?? err?.statusCode ?? 0;
  // 429 = rate limit / quota exhausted → try next key
  // 503 / 502 / 504 = transient server errors → try next key
  if (status === 429 || status === 503 || status === 502 || status === 504) return true;
  // model_not_found on this key → try next key (different org may have access)
  const code: string = err?.error?.code ?? err?.code ?? "";
  if (code === "model_not_found") return true;
  return false;
}

// ─── Core chat completion with key-rotation failover ─────────────
export async function resumeGroqChat(req: ResumeGroqRequest): Promise<string> {
  const model   = config.groqResumeModel;
  const total   = slots.length;
  const maxTries = Math.min(total, 5); // never more than 5 attempts

  // Start from the current round-robin position
  const startIdx = roundRobinCursor % total;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const slotIdx = (startIdx + attempt) % total;
    const slot    = slots[slotIdx];

    // Skip slots where we already know the model is unavailable
    const available = await checkModelAvailability(slot);
    if (!available) {
      console.warn(`[ResumeGroq] Key slot ${slot.index}: skipping — model not available on this key`);
      continue;
    }

    try {
      console.info(`[ResumeGroq] Using key slot ${slot.index} (model: ${model})`);

      const completion = await slot.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: req.system },
          { role: "user",   content: req.user   },
        ],
        temperature:     req.temperature ?? 0.3,
        max_tokens:      req.maxTokens   ?? 4096,
        ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });

      const text = completion.choices?.[0]?.message?.content ?? "";
      if (!text) throw new Error("Empty response from Groq");

      // Advance cursor for the next call (round-robin)
      roundRobinCursor = (slotIdx + 1) % total;
      slot.lastError   = null;
      return text;

    } catch (err: any) {
      slot.lastError = err?.message ?? String(err);
      console.error(`[ResumeGroq] Key slot ${slot.index} failed: ${slot.lastError}`);

      if (!isRetryableError(err)) {
        // Non-retryable error (bad prompt, parse error, auth invalid) — throw immediately
        throw err;
      }

      // Retryable → log and try next slot
      console.warn(`[ResumeGroq] Key slot ${slot.index} returned ${err?.status ?? "error"} — trying next key`);
    }
  }

  // All slots exhausted
  const errors = slots
    .slice(0, maxTries)
    .map(s => `slot ${s.index}: ${s.lastError ?? "skipped"}`)
    .join("; ");
  throw new Error(`[ResumeGroq] All ${maxTries} key attempts failed. Errors: ${errors}`);
}

// ─── Convenience: parse JSON from the response safely ────────────
export async function resumeGroqJson<T = Record<string, unknown>>(req: ResumeGroqRequest): Promise<T> {
  const raw = await resumeGroqChat({ ...req, jsonMode: true });
  // Strip accidental markdown code fences
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Expose current slot health for logging (no keys) ────────────
export function getResumeGroqHealth(): { slot: number; modelAvailable: boolean | null; lastError: string | null }[] {
  return slots.map(s => ({
    slot:           s.index,
    modelAvailable: s.modelAvailable,
    lastError:      s.lastError,
  }));
}
