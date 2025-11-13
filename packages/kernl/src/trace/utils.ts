import { randomID } from "@kernl/shared/lib";

/**
 * Generate a trace ID using 16 random bytes (128-bit, 32 hex chars).
 * @returns A trace ID prefixed with `trace_`.
 */
export function generateTraceId(): string {
  return `trace_${randomID(16)}`;
}

/**
 * Generate a span ID using 12 random bytes (96-bit, 24 hex chars).
 * @returns A span ID prefixed with `span_`.
 */
export function generateSpanId(): string {
  return `span_${randomID(12)}`;
}

/**
 * Generate a group ID using 12 random bytes (96-bit, 24 hex chars).
 * @returns A group ID prefixed with `group_`.
 */
export function generateGroupId(): string {
  return `group_${randomID(12)}`;
}

/**
 * Remove fields that start with an underscore from an object.
 * @param obj - The object to remove private fields from.
 * @returns A new object with private fields removed.
 */
export function removePrivateFields(
  obj: Record<string, any>,
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !key.startsWith("_")),
  );
}
