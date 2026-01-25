/**
 * Shared utilities for LibSQL storage.
 */

/**
 * Parse a JSON string from SQLite into an object.
 *
 * SQLite stores JSON as TEXT, so we need to parse it back.
 */
export function parsejson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}
