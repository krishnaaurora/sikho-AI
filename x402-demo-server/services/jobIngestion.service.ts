import crypto from "crypto";
import Job, { IJob } from "../models/Job.model";
import { analyzeJobsBatch } from "./jobIntelligence.service";


// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
export interface RawApifyJob {
  // Google Jobs Scraper field names (and common variants)
  positionName?: string;
  title?: string;
  companyName?: string;
  company?: string;
  location?: string;
  description?: string;
  jobDescription?: string;
  salary?: string;
  salaryText?: string;
  url?: string;
  jobUrl?: string;
  applyUrl?: string;
  id?: string;
  jobId?: string;
  postedAt?: string;
  datePosted?: string;
  isRemote?: boolean;
  employmentType?: string;
  workType?: string;
  skills?: string[];
  requirements?: string[];
  responsibilities?: string[];
}

export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  remoteType: "Remote" | "Hybrid" | "On-site" | "Unspecified";
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  source: string;
  sourceJobId: string;
  jobHash: string;
  jobUrl?: string;
  postedAt?: Date;
  scrapedAt: Date;
}

export interface IngestionResult {
  ingested: number;
  duplicates: number;
  invalid: number;
  errors: string[];
  jobs: IJob[];
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/** Deterministic hash from content fields to detect near-duplicates */
function buildJobHash(title: string, company: string, description: string): string {
  const raw = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${description.slice(0, 200).toLowerCase().trim()}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/** Derive source job ID from available Apify fields */
function deriveSourceJobId(raw: RawApifyJob, index: number): string {
  return (raw.id || raw.jobId || `apify_${index}_${Date.now()}`).toString().slice(0, 200);
}

/** Infer remote type from available clues */
function inferRemoteType(raw: RawApifyJob): "Remote" | "Hybrid" | "On-site" | "Unspecified" {
  const flags = [
    raw.isRemote,
    raw.employmentType,
    raw.workType,
    raw.location,
    raw.title,
    raw.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (flags.includes("remote")) return "Remote";
  if (flags.includes("hybrid")) return "Hybrid";
  if (flags.includes("on-site") || flags.includes("onsite") || flags.includes("in-office")) return "On-site";
  return "Unspecified";
}

/** Attempt to extract a date, return undefined on failure */
function parseDate(val?: string): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

// ─────────────────────────────────────────────
//  Validation
// ─────────────────────────────────────────────
function validateRaw(raw: RawApifyJob): string | null {
  const title = raw.positionName || raw.title;
  const company = raw.companyName || raw.company;
  const description = raw.description || raw.jobDescription;

  if (!title || title.trim().length < 2) return "Missing or too-short title";
  if (!company || company.trim().length < 1) return "Missing company name";
  if (!description || description.trim().length < 20) return "Missing or too-short description";
  return null;
}

// ─────────────────────────────────────────────
//  Normalization
// ─────────────────────────────────────────────
function normalizeRaw(raw: RawApifyJob, index: number, source = "apify"): NormalizedJob {
  const title = (raw.positionName || raw.title || "").trim();
  const company = (raw.companyName || raw.company || "").trim();
  const description = (raw.description || raw.jobDescription || "").trim();
  const location = (raw.location || "India").trim();

  return {
    title,
    company,
    location,
    remoteType: inferRemoteType(raw),
    description,
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    responsibilities: Array.isArray(raw.responsibilities) ? raw.responsibilities : [],
    salary: raw.salary || raw.salaryText,
    source,
    sourceJobId: deriveSourceJobId(raw, index),
    jobHash: buildJobHash(title, company, description),
    jobUrl: raw.url || raw.jobUrl || raw.applyUrl,
    postedAt: parseDate(raw.postedAt || raw.datePosted),
    scrapedAt: new Date(),
  };
}

// ─────────────────────────────────────────────
//  Core Ingestion Service
// ─────────────────────────────────────────────

/**
 * Ingest raw Apify job items into the `jobs` collection.
 *
 * Strategy:
 *  1. Validate each item → skip invalid
 *  2. Normalize each item → structured NormalizedJob
 *  3. Deduplicate within the batch (jobHash uniqueness)
 *  4. Bulk-upsert by { source + sourceJobId } — updates existing, inserts new
 *  5. Also guard on jobHash unique index as a secondary dedup layer
 */
export async function ingestApifyJobs(
  rawJobs: RawApifyJob[],
  source = "apify"
): Promise<IngestionResult> {
  const result: IngestionResult = {
    ingested: 0,
    duplicates: 0,
    invalid: 0,
    errors: [],
    jobs: [],
  };

  // ── Step 1 & 2: Validate + Normalize ──
  const seen = new Set<string>(); // deduplicate within this batch by jobHash
  const toUpsert: NormalizedJob[] = [];

  for (let i = 0; i < rawJobs.length; i++) {
    const raw = rawJobs[i];

    const validationError = validateRaw(raw);
    if (validationError) {
      result.invalid++;
      result.errors.push(`Item ${i}: ${validationError}`);
      continue;
    }

    const normalized = normalizeRaw(raw, i, source);

    // Batch-level deduplication
    if (seen.has(normalized.jobHash)) {
      result.duplicates++;
      continue;
    }
    seen.add(normalized.jobHash);
    toUpsert.push(normalized);
  }

  if (toUpsert.length === 0) {
    return result;
  }

  // ── Step 3: Bulk upsert with deduplication ──
  // Use ordered: false so partial failures don't stop others
  const bulkOps = toUpsert.map((job) => ({
    updateOne: {
      filter: { source: job.source, sourceJobId: job.sourceJobId },
      update: { $setOnInsert: job },
      upsert: true,
    },
  }));

  try {
    const bulkResult = await Job.bulkWrite(bulkOps, { ordered: false });
    result.ingested = bulkResult.upsertedCount ?? 0;
    result.duplicates += (bulkResult.matchedCount ?? 0); // existing docs = duplicates skipped

    // Fetch the ingested jobs for downstream use (e.g. matching)
    const upsertedIds = Object.values(bulkResult.upsertedIds || {});
    if (upsertedIds.length > 0) {
      result.jobs = await Job.find({ _id: { $in: upsertedIds } }).lean() as unknown as IJob[];

      // ── Phase 8: Fire-and-forget intelligence analysis on newly ingested jobs ──
      const newJobIds = result.jobs.map((j) => (j._id as any).toString());
      setImmediate(() => {
        analyzeJobsBatch(newJobIds).catch((err: any) =>
          console.error("[JobIngestion] Intelligence analysis background task failed:", err.message)
        );
      });
    }
  } catch (err: any) {
    // Handle duplicate key errors from the jobHash unique index (secondary dedup)
    if (err.code === 11000 || (err.writeErrors && err.writeErrors.length > 0)) {
      const dupCount = err.writeErrors?.filter((e: any) => e.code === 11000).length ?? 0;
      result.duplicates += dupCount;
      result.ingested += (toUpsert.length - dupCount - result.invalid);
      result.errors.push(`Duplicate key conflicts (secondary dedup): ${dupCount}`);
    } else {
      result.errors.push(`Bulk write error: ${err.message}`);
      throw err;
    }
  }

  return result;
}
