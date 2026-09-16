import axios from "axios";
import crypto from "crypto";
import { logger } from "../utils/logger";

export interface DiscoveredFile {
  filePath: string;
  language: string;
  size: number;
  sha: string;
}

export interface DiscoveredRepo {
  owner: string;
  repository: string;
  repoUrl: string;
  defaultBranch: string;
  commitSha: string;
  reviewableFiles: DiscoveredFile[];
  totalTreeFiles: number;
}

const REVIEWABLE_EXTENSIONS: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".php": "php",
  ".rb": "ruby",
  ".swift": "swift",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".dart": "dart",
  ".sol": "solidity",
  ".teal": "teal",
  ".vue": "vue",
  ".svelte": "svelte",
  ".mjs": "javascript",
  ".cjs": "javascript",
};

const EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".cache",
  "vendor",
  "venv",
  ".venv",
  "__pycache__",
  "target",
  "bin",
  "obj",
  ".github",
  ".vscode",
  ".idea",
];

const EXCLUDED_FILENAMES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "cargo.lock",
  "gemfile.lock",
  "composer.lock",
  "poetry.lock",
];

const MAX_FILE_SIZE_BYTES = parseInt(
  process.env.MAX_FILE_SIZE || "204800",
  10
); // 200 KB
const MAX_REVIEW_FILES = parseInt(
  process.env.MAX_REVIEW_FILES || "50",
  10
); // Cap per review session

// In-memory cache for discovered repositories (TTL 15 minutes)
const repoCache = new Map<string, { data: DiscoveredRepo; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Validates and parses GitHub repository URL with SSRF protection
 */
export function parseAndValidateGithubUrl(rawUrl: string): {
  owner: string;
  repo: string;
  normalizedUrl: string;
} {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("GitHub repository URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Invalid URL format. Please provide a valid GitHub URL.");
  }

  // Strict SSRF protection: only allow github.com hostname
  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
    throw new Error(
      "Only public repositories hosted on github.com are permitted."
    );
  }

  // Path format: /owner/repository
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error(
      "Invalid GitHub repository URL. Expected format: https://github.com/<owner>/<repository>"
    );
  }

  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, "");

  if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) {
    throw new Error("Invalid GitHub repository or organization name.");
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}

/**
 * Filters a list of file paths to extract reviewable source files
 */
function filterPathsToReviewableFiles(
  items: Array<{ path: string; size?: number; sha?: string }>,
  effectiveMaxFiles: number
): DiscoveredFile[] {
  const reviewableFiles: DiscoveredFile[] = [];

  for (const item of items) {
    const path = item.path;
    const pathLower = path.toLowerCase();

    // Check directory exclusion
    const pathSegments = path.split("/");
    const isExcludedDir = pathSegments.some((seg) =>
      EXCLUDED_DIRS.includes(seg.toLowerCase())
    );
    if (isExcludedDir) continue;

    // Check filename exclusion
    const fileName = pathSegments[pathSegments.length - 1].toLowerCase();
    if (EXCLUDED_FILENAMES.includes(fileName)) continue;
    if (fileName.endsWith(".min.js") || fileName.endsWith(".min.css")) continue;

    // Check file extension
    const extMatch = pathLower.match(/\.[a-z0-9]+$/i);
    if (!extMatch) continue;
    const ext = extMatch[0];

    const language = REVIEWABLE_EXTENSIONS[ext];
    if (!language) continue;

    const size = item.size || 5000;
    if (size > MAX_FILE_SIZE_BYTES) {
      continue;
    }

    reviewableFiles.push({
      filePath: path,
      language,
      size,
      sha: item.sha || crypto.createHash("sha1").update(path).digest("hex"),
    });

    if (reviewableFiles.length >= effectiveMaxFiles) {
      break;
    }
  }

  return reviewableFiles;
}

/**
 * Direct archive scanner fallback: downloads public zip without burning REST API rate limits
 */
async function discoverViaArchiveScanner(
  owner: string,
  repo: string,
  normalizedUrl: string,
  effectiveMaxFiles: number
): Promise<DiscoveredRepo> {
  logger.info(`[GitHub RateLimit Fallback] Scanning repository archive for ${owner}/${repo}...`);

  const branchCandidates = ["main", "master", "develop"];
  let zipBuffer: Buffer | null = null;
  let resolvedBranch = "main";

  for (const branch of branchCandidates) {
    try {
      const zipUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`;
      const res = await axios.get(zipUrl, {
        responseType: "arraybuffer",
        timeout: 25000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
      });
      if (res.status === 200 && res.data) {
        zipBuffer = Buffer.from(res.data);
        resolvedBranch = branch;
        break;
      }
    } catch (_) {
      // Try next branch candidate
    }
  }

  if (!zipBuffer) {
    throw new Error(
      `Unable to fetch repository archive for ${owner}/${repo}. Please verify repository is public.`
    );
  }

  // Parse ZIP file entries from PK\x03\x04 headers
  const fileEntries: Array<{ path: string; size: number }> = [];
  let pos = 0;
  while (pos < zipBuffer.length - 4) {
    if (
      zipBuffer[pos] === 0x50 &&
      zipBuffer[pos + 1] === 0x4b &&
      zipBuffer[pos + 2] === 0x03 &&
      zipBuffer[pos + 3] === 0x04
    ) {
      const nameLen = zipBuffer.readUInt16LE(pos + 26);
      const extraLen = zipBuffer.readUInt16LE(pos + 28);
      const uncompressedSize = zipBuffer.readUInt32LE(pos + 22);
      const name = zipBuffer
        .subarray(pos + 30, pos + 30 + nameLen)
        .toString("utf-8");

      if (!name.endsWith("/")) {
        // Strip the root folder name generated in GitHub zip (e.g. "repo-main/")
        const cleanPath = name.split("/").slice(1).join("/");
        if (cleanPath) {
          fileEntries.push({ path: cleanPath, size: uncompressedSize });
        }
      }
      pos += 30 + nameLen + extraLen;
    } else {
      pos++;
    }
  }

  const reviewableFiles = filterPathsToReviewableFiles(fileEntries, effectiveMaxFiles);

  if (reviewableFiles.length === 0) {
    throw new Error(
      `No reviewable source files (TS, JS, Python, Go, Rust, Java, C++, etc.) found in repository ${owner}/${repo}.`
    );
  }

  const commitSha = resolvedBranch;

  return {
    owner,
    repository: repo,
    repoUrl: normalizedUrl,
    defaultBranch: resolvedBranch,
    commitSha,
    reviewableFiles,
    totalTreeFiles: fileEntries.length,
  };
}

/**
 * Discovers repository file tree with multi-tier rate-limit bypass and caching
 */
export async function discoverGithubRepository(
  rawUrl: string,
  maxFilesLimit?: number
): Promise<DiscoveredRepo> {
  const { owner, repo, normalizedUrl } = parseAndValidateGithubUrl(rawUrl);
  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const effectiveMaxFiles = Math.min(
    maxFilesLimit && maxFilesLimit > 0 ? maxFilesLimit : MAX_REVIEW_FILES,
    MAX_REVIEW_FILES
  );

  // 1. Check in-memory cache
  const cached = repoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.info(`[GitHub Cache] Returning cached tree for ${cacheKey}`);
    return {
      ...cached.data,
      reviewableFiles: cached.data.reviewableFiles.slice(0, effectiveMaxFiles),
    };
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SikhoAI-Repository-Reviewer/1.0",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // 2. Try Standard GitHub REST API
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers,
        timeout: 10000,
      }
    );
    const repoData = res.data;
    const defaultBranch = repoData.default_branch || "main";

    let commitSha = defaultBranch;
    try {
      const branchRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`,
        {
          headers,
          timeout: 10000,
        }
      );
      commitSha = branchRes.data.sha;
    } catch (_) {
      // Fallback commitSha to default branch name
    }

    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
      {
        headers,
        timeout: 15000,
      }
    );

    const rawTree: any[] = treeRes.data.tree || [];
    const treeItems = rawTree
      .filter((item) => item.type === "blob")
      .map((item) => ({ path: item.path, size: item.size, sha: item.sha }));

    const reviewableFiles = filterPathsToReviewableFiles(treeItems, effectiveMaxFiles);

    if (reviewableFiles.length === 0) {
      throw new Error(
        `No reviewable source files (TS, JS, Python, Go, Rust, Java, C++, etc.) found in repository ${owner}/${repo}.`
      );
    }

    const result: DiscoveredRepo = {
      owner,
      repository: repo,
      repoUrl: normalizedUrl,
      defaultBranch,
      commitSha,
      reviewableFiles,
      totalTreeFiles: rawTree.length,
    };

    repoCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    const isRateLimit =
      err.response?.status === 403 ||
      err.response?.status === 429 ||
      err.message?.includes("rate limit") ||
      err.response?.data?.message?.toLowerCase().includes("api rate limit");

    if (err.response?.status === 404) {
      throw new Error(`GitHub repository "${owner}/${repo}" was not found or is private.`);
    }

    if (isRateLimit || err.code === "ECONNABORTED" || err.response?.status >= 500) {
      logger.warn(
        `GitHub API rate limit/error encountered (${err.message}). Activating direct archive scanner bypass for ${owner}/${repo}...`
      );
      const fallbackResult = await discoverViaArchiveScanner(
        owner,
        repo,
        normalizedUrl,
        effectiveMaxFiles
      );
      repoCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
      return fallbackResult;
    }

    throw new Error(`Failed to inspect GitHub repository: ${err.message}`);
  }
}

/**
 * Downloads raw file content from GitHub raw user content with multi-branch fallbacks
 */
export async function fetchRawGithubFileContent(
  owner: string,
  repo: string,
  commitSha: string,
  filePath: string
): Promise<string> {
  const branchCandidates = [commitSha, "main", "master", "develop"].filter(Boolean);

  for (const ref of branchCandidates) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
    try {
      const res = await axios.get(rawUrl, {
        responseType: "text",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (res.status === 200 && typeof res.data === "string") {
        return res.data;
      }
    } catch (_) {
      // Try next ref
    }
  }

  throw new Error(`Failed to download raw file ${filePath} from ${owner}/${repo}`);
}
