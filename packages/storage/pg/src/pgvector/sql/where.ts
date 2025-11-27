import type { Codec } from "@kernl-sdk/shared/lib";
import type { Filter, FieldOps } from "@kernl-sdk/retrieval";
import type { WhereInput } from "./query";
import type { SQLClause } from "./select";

/**
 * Codec for building WHERE clause from MongoDB-style filter.
 */
export const SQL_WHERE: Codec<WhereInput, SQLClause> = {
  encode({ filter, startIdx }) {
    if (!filter) {
      return { sql: "", params: [] };
    }
    return encodeFilter(filter, startIdx);
  },

  decode() {
    throw new Error("SQL_WHERE.decode not implemented");
  },
};

/**
 * Encode a filter to SQL (recursive).
 */
function encodeFilter(filter: Filter, startIdx: number): SQLClause {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = startIdx;

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) continue;

    // $and
    if (key === "$and" && Array.isArray(value)) {
      const parts: string[] = [];
      for (const sub of value as Filter[]) {
        const clause = encodeFilter(sub, idx);
        if (clause.sql) {
          parts.push(`(${clause.sql})`);
          params.push(...clause.params);
          idx += clause.params.length;
        }
      }
      if (parts.length > 0) {
        conditions.push(`(${parts.join(" AND ")})`);
      }
      continue;
    }

    // $or
    if (key === "$or" && Array.isArray(value)) {
      const parts: string[] = [];
      for (const sub of value as Filter[]) {
        const clause = encodeFilter(sub, idx);
        if (clause.sql) {
          parts.push(`(${clause.sql})`);
          params.push(...clause.params);
          idx += clause.params.length;
        }
      }
      if (parts.length > 0) {
        conditions.push(`(${parts.join(" OR ")})`);
      }
      continue;
    }

    // $not
    if (key === "$not" && typeof value === "object" && !Array.isArray(value)) {
      const clause = encodeFilter(value as Filter, idx);
      if (clause.sql) {
        conditions.push(`NOT (${clause.sql})`);
        params.push(...clause.params);
        idx += clause.params.length;
      }
      continue;
    }

    // field operators
    if (isFieldOps(value)) {
      const ops = value;

      if (ops.$eq !== undefined) {
        conditions.push(`"${key}" = $${idx++}`);
        params.push(ops.$eq);
      }
      if (ops.$neq !== undefined) {
        conditions.push(`"${key}" != $${idx++}`);
        params.push(ops.$neq);
      }
      if (ops.$gt !== undefined) {
        conditions.push(`"${key}" > $${idx++}`);
        params.push(ops.$gt);
      }
      if (ops.$gte !== undefined) {
        conditions.push(`"${key}" >= $${idx++}`);
        params.push(ops.$gte);
      }
      if (ops.$lt !== undefined) {
        conditions.push(`"${key}" < $${idx++}`);
        params.push(ops.$lt);
      }
      if (ops.$lte !== undefined) {
        conditions.push(`"${key}" <= $${idx++}`);
        params.push(ops.$lte);
      }
      if (ops.$in !== undefined) {
        conditions.push(`"${key}" = ANY($${idx++})`);
        params.push(ops.$in);
      }
      if (ops.$nin !== undefined) {
        conditions.push(`"${key}" != ALL($${idx++})`);
        params.push(ops.$nin);
      }
      if (ops.$contains !== undefined) {
        conditions.push(`"${key}" ILIKE $${idx++}`);
        params.push(`%${ops.$contains}%`);
      }
      if (ops.$startsWith !== undefined) {
        conditions.push(`"${key}" ILIKE $${idx++}`);
        params.push(`${ops.$startsWith}%`);
      }
      if (ops.$endsWith !== undefined) {
        conditions.push(`"${key}" ILIKE $${idx++}`);
        params.push(`%${ops.$endsWith}`);
      }
      if (ops.$exists !== undefined) {
        conditions.push(
          ops.$exists ? `"${key}" IS NOT NULL` : `"${key}" IS NULL`,
        );
      }
      continue;
    }

    // Equality shorthand: { status: "active" }
    if (value === null) {
      conditions.push(`"${key}" IS NULL`);
    } else {
      conditions.push(`"${key}" = $${idx++}`);
      params.push(value);
    }
  }

  return { sql: conditions.join(" AND "), params };
}

/**
 * Check if value is an operator object (has $-prefixed keys).
 */
function isFieldOps(value: unknown): value is FieldOps {
  if (typeof value !== "object" || value === null) return false;
  return Object.keys(value).some((k) => k.startsWith("$"));
}
