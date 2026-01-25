/**
 * Path utilities for security and validation.
 */
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";

/**
 * Get XDG data directory for popcorn.
 * - Linux: ~/.local/share/popcorn
 * - macOS: ~/Library/Application Support/popcorn
 */
export function getDataDir(): string {
  const base = process.env.XDG_DATA_HOME
    ? process.env.XDG_DATA_HOME
    : process.platform === "darwin"
      ? path.join(homedir(), "Library", "Application Support")
      : path.join(homedir(), ".local", "share");
  return path.join(base, "popcorn");
}

/**
 * Ensure the data directory exists, creating it if necessary.
 * Returns the data directory path.
 */
export function dataDir(): string {
  const dir = getDataDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Check if a path is contained within a base directory.
 * Uses lexical comparison after normalization.
 *
 * NOTE: This is lexical only - symlinks inside the project can escape.
 * Consider using realpath for stronger guarantees if needed.
 */
export function contains(base: string, target: string): boolean {
  const normalizedBase = path.normalize(base);
  const normalizedTarget = path.normalize(target);

  // Ensure base ends with separator for proper prefix matching
  const baseWithSep = normalizedBase.endsWith(path.sep)
    ? normalizedBase
    : normalizedBase + path.sep;

  return (
    normalizedTarget === normalizedBase ||
    normalizedTarget.startsWith(baseWithSep)
  );
}

/**
 * Resolve a path relative to a base directory, ensuring it doesn't escape.
 * Returns null if the path would escape the base directory.
 */
export function safeResolve(base: string, relative: string): string | null {
  const resolved = path.resolve(base, relative);

  if (!contains(base, resolved)) {
    return null;
  }

  return resolved;
}

/**
 * Validate that a directory exists and is accessible.
 */
export async function validateDirectory(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Normalize and validate a directory path.
 * Returns the normalized absolute path, or null if invalid.
 */
export async function normalizeDirectory(
  dir: string,
  fallback: string,
): Promise<string> {
  // Must be absolute
  if (!path.isAbsolute(dir)) {
    return fallback;
  }

  // Normalize to remove . and .. segments
  const normalized = path.normalize(dir);

  // Validate it exists
  if (!(await validateDirectory(normalized))) {
    return fallback;
  }

  return normalized;
}
