import axios from "axios";
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
 * Discovers repository file tree and filters reviewable source code files
 */
export async function discoverGithubRepository(
  rawUrl: string,
  maxFilesLimit?: number
): Promise<DiscoveredRepo> {
  const { owner, repo, normalizedUrl } = parseAndValidateGithubUrl(rawUrl);
  const effectiveMaxFiles = Math.min(
    maxFilesLimit && maxFilesLimit > 0 ? maxFilesLimit : MAX_REVIEW_FILES,
    MAX_REVIEW_FILES
  );

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SikhoAI-Repository-Reviewer/1.0",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // 1. Fetch Repository Metadata
  let repoData: any;
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers,
        timeout: 10000,
      }
    );
    repoData = res.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error(
        `GitHub repository "${owner}/${repo}" was not found or is private.`
      );
    }
    if (err.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again shortly.");
    }
    throw new Error(`Failed to fetch repository metadata: ${err.message}`);
  }

  const defaultBranch = repoData.default_branch || "main";

  // 2. Fetch Latest Commit SHA on Default Branch
  let commitSha = "";
  try {
    const branchRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`,
      {
        headers,
        timeout: 10000,
      }
    );
    commitSha = branchRes.data.sha;
  } catch (err: any) {
    throw new Error(`Failed to resolve commit SHA for branch "${defaultBranch}": ${err.message}`);
  }

  // 3. Fetch Full Recursive File Tree
  let treeRes: any;
  try {
    treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
      {
        headers,
        timeout: 15000,
      }
    );
  } catch (err: any) {
    throw new Error(`Failed to fetch repository file tree: ${err.message}`);
  }

  const rawTree: any[] = treeRes.data.tree || [];
  const reviewableFiles: DiscoveredFile[] = [];

  for (const item of rawTree) {
    if (item.type !== "blob") continue; // only files, not directories or submodules

    const path: string = item.path;
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

    const size = item.size || 0;
    if (size > MAX_FILE_SIZE_BYTES) {
      logger.warn(`Skipping ${path} (size ${size} bytes exceeds ${MAX_FILE_SIZE_BYTES} bytes limit)`);
      continue;
    }

    reviewableFiles.push({
      filePath: path,
      language,
      size,
      sha: item.sha,
    });

    if (reviewableFiles.length >= effectiveMaxFiles) {
      logger.info(`Reached maximum review file limit (${effectiveMaxFiles} files).`);
      break;
    }
  }

  if (reviewableFiles.length === 0) {
    throw new Error(
      `No reviewable source files (TS, JS, Python, Go, Rust, Java, C++, etc.) found in repository ${owner}/${repo}.`
    );
  }

  return {
    owner,
    repository: repo,
    repoUrl: normalizedUrl,
    defaultBranch,
    commitSha,
    reviewableFiles,
    totalTreeFiles: rawTree.length,
  };
}

/**
 * Downloads raw file content from GitHub raw user content
 */
export async function fetchRawGithubFileContent(
  owner: string,
  repo: string,
  commitSha: string,
  filePath: string
): Promise<string> {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${filePath}`;
  try {
    const res = await axios.get(rawUrl, {
      responseType: "text",
      timeout: 15000,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(`Failed to download raw file ${filePath}: ${err.message}`);
  }
}
