/**
 * File indexing and search for project directories.
 *
 * Uses ripgrep for fast file discovery (respects .gitignore).
 * Provides fuzzy search over file paths.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import fuzzysort from "fuzzysort";
import { Ripgrep } from "@/util/ripgrep";

// --- Types ---

interface FileCache {
  files: string[];
  dirs: string[];
  timestamp: number;
}

interface SearchOptions {
  query: string;
  directory: string;
  limit?: number;
  dirs?: boolean;
  type?: "file" | "directory";
}

// --- Constants ---

const CACHE_TTL = 30_000; // 30 seconds
const DEFAULT_LIMIT = 100;

// --- Cache ---

const cache = new Map<string, FileCache>();
const building = new Map<
  string,
  Promise<{ files: string[]; dirs: string[] }>
>();

// --- Index Building ---

/**
 * Build file index for a directory using ripgrep.
 */
async function buildIndex(
  directory: string,
): Promise<{ files: string[]; dirs: string[] }> {
  const isHome = directory === os.homedir();

  // Special case: home directory - limit depth to avoid scanning everything
  if (isHome) {
    return buildHomeIndex(directory);
  }

  // Skip scanning root directory
  if (directory === path.parse(directory).root) {
    return { files: [], dirs: [] };
  }

  const files: string[] = [];
  const dirSet = new Set<string>();

  for await (const file of Ripgrep.files({ cwd: directory })) {
    files.push(file);

    // Extract directories from file path
    let current = file;
    while (true) {
      const dir = path.dirname(current);
      if (dir === "." || dir === current) break;
      current = dir;
      if (dirSet.has(dir)) break;
      dirSet.add(dir);
    }
  }

  const dirs = Array.from(dirSet)
    .map((d) => d + "/")
    .sort();

  return { files, dirs };
}

/**
 * Build limited index for home directory.
 * Only scans 2 levels deep, ignoring common system directories.
 */
async function buildHomeIndex(
  directory: string,
): Promise<{ files: string[]; dirs: string[] }> {
  const dirs = new Set<string>();
  const ignore = new Set<string>();

  // Platform-specific ignores
  if (process.platform === "darwin") ignore.add("Library");
  if (process.platform === "win32") ignore.add("AppData");

  const ignoreNested = new Set([
    "node_modules",
    "dist",
    "build",
    "target",
    "vendor",
  ]);
  const shouldIgnore = (name: string) =>
    name.startsWith(".") || ignore.has(name);
  const shouldIgnoreNested = (name: string) =>
    name.startsWith(".") || ignoreNested.has(name);

  try {
    const top = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of top) {
      if (!entry.isDirectory()) continue;
      if (shouldIgnore(entry.name)) continue;
      dirs.add(entry.name + "/");

      // Second level
      const base = path.join(directory, entry.name);
      const children = await fs
        .readdir(base, { withFileTypes: true })
        .catch(() => []);
      for (const child of children) {
        if (!child.isDirectory()) continue;
        if (shouldIgnoreNested(child.name)) continue;
        dirs.add(entry.name + "/" + child.name + "/");
      }
    }
  } catch {
    // Ignore errors
  }

  return { files: [], dirs: Array.from(dirs).sort() };
}

// --- Index Management ---

/**
 * Get cached index, waiting for first build if needed.
 */
async function getIndex(
  directory: string,
): Promise<{ files: string[]; dirs: string[] }> {
  const now = Date.now();
  const existing = cache.get(directory);

  // Return fresh cache if available
  if (existing && now - existing.timestamp < CACHE_TTL) {
    return existing;
  }

  // Check if we're already building
  let buildPromise = building.get(directory);

  if (!buildPromise) {
    // Start new build
    buildPromise = buildIndex(directory)
      .then((result) => {
        cache.set(directory, {
          ...result,
          timestamp: Date.now(),
        });
        return result;
      })
      .catch(() => {
        // On error, return stale cache or empty
        return existing ?? { files: [], dirs: [] };
      })
      .finally(() => {
        building.delete(directory);
      });

    building.set(directory, buildPromise);
  }

  // If we have stale cache, return it immediately (background refresh)
  // Otherwise wait for the build to complete
  if (existing) {
    return existing;
  }

  return buildPromise;
}

/**
 * Invalidate cache for a directory.
 */
export function invalidate(directory: string): void {
  cache.delete(directory);
}

// --- Search Utilities ---

/**
 * Check if a path is hidden (contains a dot-prefixed segment).
 */
function isHidden(item: string): boolean {
  const normalized = item.replaceAll("\\", "/").replace(/\/+$/, "");
  return normalized.split("/").some((p) => p.startsWith(".") && p.length > 1);
}

/**
 * Sort hidden items last, unless query prefers hidden.
 */
function sortHiddenLast(items: string[], preferHidden: boolean): string[] {
  if (preferHidden) return items;

  const visible: string[] = [];
  const hidden: string[] = [];

  for (const item of items) {
    if (isHidden(item)) {
      hidden.push(item);
    } else {
      visible.push(item);
    }
  }

  return [...visible, ...hidden];
}

// --- Public API ---

/**
 * Search for files/directories matching a query.
 */
export async function search(options: SearchOptions): Promise<string[]> {
  const {
    query: rawQuery,
    directory,
    limit = DEFAULT_LIMIT,
    dirs = true,
    type,
  } = options;

  const query = rawQuery.trim();
  const kind = type ?? (dirs === false ? "file" : "all");
  const preferHidden = query.startsWith(".") || query.includes("/.");

  const index = await getIndex(directory);

  // Determine which items to search
  let items: string[];
  if (kind === "file") {
    items = index.files;
  } else if (kind === "directory") {
    items = index.dirs;
  } else {
    items = [...index.files, ...index.dirs];
  }

  // Empty query: return items sorted with hidden last
  if (!query) {
    if (kind === "file") {
      return items.slice(0, limit);
    }
    return sortHiddenLast(items, preferHidden).slice(0, limit);
  }

  // Fuzzy search
  // For directories, search more and then filter hidden
  const searchLimit =
    kind === "directory" && !preferHidden ? limit * 20 : limit;

  const results = fuzzysort
    .go(query, items, { limit: searchLimit })
    .map((r) => r.target);

  // Sort hidden last for directory searches
  const output =
    kind === "directory"
      ? sortHiddenLast(results, preferHidden).slice(0, limit)
      : results;

  return output;
}

/**
 * Initialize file index for a directory (call on startup).
 */
export function init(directory: string): void {
  // Trigger initial index build in background
  getIndex(directory);
}
