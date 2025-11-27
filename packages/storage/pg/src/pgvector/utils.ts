/**
 * pgvector utility functions.
 */

/**
 * Parse index id into schema and table.
 *
 * - "docs" → { schema: "public", table: "docs" }
 * - "analytics.events" → { schema: "analytics", table: "events" }
 */
export function parseIndexId(id: string): { schema: string; table: string } {
  const parts = id.split(".");
  if (parts.length === 2) {
    return { schema: parts[0], table: parts[1] };
  }
  return { schema: "public", table: id };
}

/**
 * Check if a value is a numeric array (vector).
 */
export function isVector(val: unknown): val is number[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0] === "number";
}
