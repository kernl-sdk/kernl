/**
 * Filter conversion codecs.
 *
 * Converts MongoDB-style filters to Turbopuffer filter format.
 */

import type { Filter, FieldOps, ScalarValue } from "@kernl-sdk/retrieval";
import type { Filter as TpufFilter } from "@turbopuffer/turbopuffer/resources/custom";

/**
 * Codec for converting Filter to Turbopuffer Filter.
 */
export const FILTER = {
  encode: (filter: Filter): TpufFilter => {
    const conditions: TpufFilter[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined) continue;

      // Logical operators
      if (key === "$and" && Array.isArray(value)) {
        const sub = (value as Filter[]).map(FILTER.encode);
        if (sub.length === 1) {
          conditions.push(sub[0]);
        } else {
          conditions.push(["And", sub]);
        }
        continue;
      }

      if (key === "$or" && Array.isArray(value)) {
        const sub = (value as Filter[]).map(FILTER.encode);
        conditions.push(["Or", sub]);
        continue;
      }

      if (key === "$not") {
        conditions.push(["Not", FILTER.encode(value as Filter)]);
        continue;
      }

      // Field-level filter
      if (isFieldOps(value)) {
        conditions.push(...encodeFieldOps(key, value));
      } else {
        // Simple equality: { field: value }
        conditions.push([key, "Eq", value as ScalarValue]);
      }
    }

    if (conditions.length === 0) {
      throw new Error("Empty filter");
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return ["And", conditions];
  },

  decode: (_filter: TpufFilter): Filter => {
    throw new Error("FILTER.decode: not implemented");
  },
};

/**
 * Check if a value is a FieldOps object (has operator keys like $eq, $gt, etc.)
 */
function isFieldOps(value: unknown): value is FieldOps {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.some((k) => k.startsWith("$"));
}

/**
 * Encode field-level operators to Turbopuffer filters.
 */
function encodeFieldOps(field: string, ops: FieldOps): TpufFilter[] {
  const conditions: TpufFilter[] = [];

  if (ops.$eq !== undefined) {
    conditions.push([field, "Eq", ops.$eq]);
  }
  if (ops.$neq !== undefined) {
    conditions.push([field, "NotEq", ops.$neq]);
  }
  if (ops.$gt !== undefined) {
    conditions.push([field, "Gt", ops.$gt]);
  }
  if (ops.$gte !== undefined) {
    conditions.push([field, "Gte", ops.$gte]);
  }
  if (ops.$lt !== undefined) {
    conditions.push([field, "Lt", ops.$lt]);
  }
  if (ops.$lte !== undefined) {
    conditions.push([field, "Lte", ops.$lte]);
  }
  if (ops.$in !== undefined) {
    conditions.push([field, "In", ops.$in]);
  }
  if (ops.$nin !== undefined) {
    conditions.push([field, "NotIn", ops.$nin]);
  }
  if (ops.$contains !== undefined) {
    conditions.push([field, "Contains", ops.$contains]);
  }
  if (ops.$startsWith !== undefined) {
    conditions.push([field, "Glob", `${ops.$startsWith}*`]);
  }
  if (ops.$endsWith !== undefined) {
    conditions.push([field, "Glob", `*${ops.$endsWith}`]);
  }
  if (ops.$exists !== undefined) {
    // exists: true → NotEq null, exists: false → Eq null
    conditions.push([field, ops.$exists ? "NotEq" : "Eq", null]);
  }

  return conditions;
}
