/**
 * companyJobScraper.service.ts
 * ─────────────────────────────────────────────────────────────────
 * Aggregates real job postings from three free, public ATS APIs:
 *   1. Greenhouse  — https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 *   2. Lever       — https://api.lever.co/v0/postings/{company}?mode=json
 *   3. Ashby       — https://api.ashbyhq.com/posting-api/job-board/{board}
 *
 * No auth keys required for any source. All endpoints are public.
 *
 * Flow:
 *   scrapeJobsForRoles(roles, limit)
 *     → parallel requests to all three sources for all companies
 *     → normalise to RawApifyJob shape
 *     → keyword-filter by role relevance
 *     → deduplicate by title+company
 *     → return top `limit` results
 */

import axios from "axios";
import type { RawApifyJob } from "./jobIngestion.service";

// ─────────────────────────────────────────────────────────────────
// Company registry
// Tech companies known to use Greenhouse, Lever, or Ashby.
// Only boards with public job listings included.
// ─────────────────────────────────────────────────────────────────

interface CompanyEntry {
  name: string;
  source: "greenhouse" | "lever" | "ashby";
  boardToken: string; // greenhouse board_token / lever company slug / ashby board name
}

const COMPANIES: CompanyEntry[] = [
  // ── Greenhouse ────────────────────────────────────────────────
  { name: "Stripe",       source: "greenhouse", boardToken: "stripe" },
  { name: "Airbnb",       source: "greenhouse", boardToken: "airbnb" },
  { name: "Databricks",   source: "greenhouse", boardToken: "databricks" },
  { name: "Confluent",    source: "greenhouse", boardToken: "confluent" },
  { name: "Scale AI",     source: "greenhouse", boardToken: "scaleai" },
  { name: "Hugging Face", source: "greenhouse", boardToken: "huggingface" },
  { name: "Cohere",       source: "greenhouse", boardToken: "cohere" },
  { name: "Weights & Biases", source: "greenhouse", boardToken: "wandb" },
  { name: "Ramp",         source: "greenhouse", boardToken: "ramp" },
  { name: "Figma",        source: "greenhouse", boardToken: "figma" },
  { name: "Notion",       source: "greenhouse", boardToken: "notion" },
  { name: "Canva",        source: "greenhouse", boardToken: "canva" },
  { name: "Vercel",       source: "greenhouse", boardToken: "vercel" },
  { name: "MongoDB",      source: "greenhouse", boardToken: "mongodb" },
  { name: "HashiCorp",    source: "greenhouse", boardToken: "hashicorp" },

  // ── Lever ─────────────────────────────────────────────────────
  { name: "Netflix",      source: "lever", boardToken: "netflix" },
  { name: "Shopify",      source: "lever", boardToken: "shopify" },
  { name: "GitHub",       source: "lever", boardToken: "github" },
  { name: "Reddit",       source: "lever", boardToken: "reddit" },
  { name: "Twitch",       source: "lever", boardToken: "twitch" },
  { name: "Lyft",         source: "lever", boardToken: "lyft" },
  { name: "Snap",         source: "lever", boardToken: "snap" },
  { name: "Dropbox",      source: "lever", boardToken: "dropbox" },
  { name: "Cloudflare",   source: "lever", boardToken: "cloudflare" },
  { name: "Airtable",     source: "lever", boardToken: "airtable" },
  { name: "Plaid",        source: "lever", boardToken: "plaid" },
  { name: "Brex",         source: "lever", boardToken: "brex" },
  { name: "Benchling",    source: "lever", boardToken: "benchling" },

  // ── Ashby ─────────────────────────────────────────────────────
  { name: "Linear",       source: "ashby", boardToken: "linear" },
  { name: "Loom",         source: "ashby", boardToken: "loom" },
  { name: "Retool",       source: "ashby", boardToken: "retool" },
  { name: "Replit",       source: "ashby", boardToken: "replit" },
  { name: "Perplexity",   source: "ashby", boardToken: "perplexityai" },
  { name: "Mistral AI",   source: "ashby", boardToken: "mistral" },
  { name: "Together AI",  source: "ashby", boardToken: "together" },
  { name: "Anyscale",     source: "ashby", boardToken: "anyscale" },
  { name: "Modal",        source: "ashby", boardToken: "modal" },
  { name: "Posit (RStudio)", source: "ashby", boardToken: "posit" },
];

// ─────────────────────────────────────────────────────────────────
// Role → keyword expansion
// Maps a career role name to keywords used to filter job titles
// ─────────────────────────────────────────────────────────────────
const ROLE_KEYWORDS: Record<string, string[]> = {
  default: ["engineer", "developer", "analyst", "scientist", "architect", "lead"],
  "machine learning engineer": ["machine learning", "ml engineer", "ml infrastructure", "mlops", "model", "deep learning", "ai engineer"],
  "ml engineer":               ["machine learning", "ml", "deep learning", "model", "mlops", "ai"],
  "data scientist":            ["data scientist", "data science", "analytics", "machine learning", "statistical", "modelling"],
  "data analyst":              ["data analyst", "analytics", "business intelligence", "bi analyst", "insights", "reporting"],
  "ai engineer":               ["ai engineer", "artificial intelligence", "llm", "generative ai", "foundation model", "nlp engineer"],
  "nlp engineer":              ["nlp", "natural language", "text", "language model", "llm", "transformers"],
  "mlops engineer":            ["mlops", "ml platform", "ml infrastructure", "model deployment", "devops", "platform engineer"],
  "software engineer":         ["software engineer", "backend", "frontend", "full stack", "platform", "infrastructure", "swe"],
  "full-stack developer":      ["full stack", "fullstack", "frontend", "backend", "web developer", "react", "node"],
  "data engineer":             ["data engineer", "etl", "pipeline", "spark", "airflow", "dbt", "warehouse"],
  "product manager":           ["product manager", "product management", "pm", "technical product"],
  "devops engineer":           ["devops", "sre", "platform engineer", "infrastructure", "kubernetes", "cloud"],
};

function getKeywordsForRole(role: string): string[] {
  const key = role.toLowerCase().trim();
  // Exact match first
  if (ROLE_KEYWORDS[key]) return ROLE_KEYWORDS[key];
  // Partial match
  for (const [k, v] of Object.entries(ROLE_KEYWORDS)) {
    if (k !== "default" && (key.includes(k) || k.includes(key))) return v;
  }
  // Fallback: split role into words
  return [...ROLE_KEYWORDS.default, ...key.split(/\s+/).filter(w => w.length > 3)];
}

function titleMatchesRoles(title: string, keywords: string[]): boolean {
  const t = title.toLowerCase();
  return keywords.some(kw => t.includes(kw.toLowerCase()));
}

// ─────────────────────────────────────────────────────────────────
// Individual source fetchers
// ─────────────────────────────────────────────────────────────────

async function fetchGreenhouse(company: CompanyEntry, keywords: string[]): Promise<RawApifyJob[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company.boardToken}/jobs?content=true`;
    const res = await axios.get(url, { timeout: 8000 });
    const jobs: any[] = res.data?.jobs || [];
    return jobs
      .filter(j => titleMatchesRoles(j.title || "", keywords))
      .map(j => ({
        title:       j.title,
        companyName: company.name,
        company:     company.name,
        location:    j.location?.name || "Remote / Unspecified",
        description: j.content || j.title,
        url:         j.absolute_url,
        jobUrl:      j.absolute_url,
        id:          `gh_${company.boardToken}_${j.id}`,
        postedAt:    j.updated_at,
      }));
  } catch (err: any) {
    console.debug(`[Scraper] Greenhouse ${company.name} failed: ${err.message}`);
    return [];
  }
}

async function fetchLever(company: CompanyEntry, keywords: string[]): Promise<RawApifyJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${company.boardToken}?mode=json&limit=50`;
    const res = await axios.get(url, { timeout: 8000 });
    const jobs: any[] = Array.isArray(res.data) ? res.data : [];
    return jobs
      .filter(j => titleMatchesRoles(j.text || "", keywords))
      .map(j => ({
        title:          j.text,
        companyName:    company.name,
        company:        company.name,
        location:       j.categories?.location || j.workplaceType || "Remote / Unspecified",
        description:    j.descriptionPlain || j.description || j.text,
        url:            j.hostedUrl,                    // job page URL
        jobUrl:         j.hostedUrl,                    // canonical job page (hostedUrl)
        applyUrl:       j.applyUrl || undefined,        // Lever's dedicated apply URL
        id:             `lv_${company.boardToken}_${j.id}`,
        postedAt:       j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
        employmentType: j.categories?.commitment,
      }));
  } catch (err: any) {
    console.debug(`[Scraper] Lever ${company.name} failed: ${err.message}`);
    return [];
  }
}

async function fetchAshby(company: CompanyEntry, keywords: string[]): Promise<RawApifyJob[]> {
  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company.boardToken}`;
    const res = await axios.get(url, { timeout: 8000 });
    const jobs: any[] = res.data?.jobPostings || [];
    return jobs
      .filter(j => titleMatchesRoles(j.title || "", keywords))
      .map(j => {
        const loc = j.isRemote ? "Remote"
          : [j.location?.city, j.location?.country].filter(Boolean).join(", ") || "Unspecified";
        return {
          title:          j.title,
          companyName:    company.name,
          company:        company.name,
          location:       loc,
          description:    j.descriptionHtml?.replace(/<[^>]+>/g, " ").substring(0, 2000) || j.title,
          url:            j.jobUrl,                       // canonical job page
          jobUrl:         j.jobUrl || undefined,          // Ashby jobUrl field
          applyUrl:       j.applyUrl || undefined,        // Ashby's dedicated apply URL
          id:             `ash_${company.boardToken}_${j.id}`,
          postedAt:       j.publishedAt,
          isRemote:       j.isRemote,
          employmentType: j.employmentType,
        };
      });
  } catch (err: any) {
    console.debug(`[Scraper] Ashby ${company.name} failed: ${err.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────

export interface ScrapeResult {
  jobs:    RawApifyJob[];
  sources: { greenhouse: number; lever: number; ashby: number };
  total:   number;
}

/**
 * Scrape real jobs from Greenhouse, Lever, and Ashby for the given career roles.
 * All requests run in parallel. Results are keyword-filtered, deduplicated, and capped.
 *
 * @param roles   Career fit roles from the resume (e.g. ["ML Engineer", "Data Scientist"])
 * @param limit   Max jobs to return (default 60)
 */
export async function scrapeJobsForRoles(
  roles: string[],
  limit = 60
): Promise<ScrapeResult> {
  // Build a unified keyword set from all roles
  const keywords = [...new Set(roles.flatMap(r => getKeywordsForRole(r)))];
  console.log(`[Scraper] Searching ${COMPANIES.length} companies for keywords: ${keywords.slice(0, 8).join(", ")}...`);

  // Fan out — all companies in parallel
  const tasks = COMPANIES.map(company => {
    if (company.source === "greenhouse") return fetchGreenhouse(company, keywords);
    if (company.source === "lever")      return fetchLever(company, keywords);
    return                                      fetchAshby(company, keywords);
  });

  const results = await Promise.allSettled(tasks);

  const counts = { greenhouse: 0, lever: 0, ashby: 0 };
  const allJobs: RawApifyJob[] = [];
  const seenKey = new Set<string>();

  results.forEach((result, idx) => {
    if (result.status !== "fulfilled") return;
    const company = COMPANIES[idx];
    const jobs    = result.value;

    counts[company.source] += jobs.length;

    for (const job of jobs) {
      // Deduplicate by normalised title+company
      const key = `${(job.title || "").toLowerCase().trim()}|${(job.companyName || "").toLowerCase().trim()}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      allJobs.push(job);
    }
  });

  console.log(
    `[Scraper] Raw results — greenhouse:${counts.greenhouse} lever:${counts.lever} ashby:${counts.ashby} ` +
    `unique:${allJobs.length}`
  );

  // Return capped results
  const finalJobs = allJobs.slice(0, limit);
  return { jobs: finalJobs, sources: counts, total: allJobs.length };
}
