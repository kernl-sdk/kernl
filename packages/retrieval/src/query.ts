/**
 * Query types for search indexes.
 *
 * Provides a MongoDB-style filter syntax and flexible query input types
 * supporting simple queries, hybrid fusion, and complex filtered searches.
 */

// ---------------------
// Filter Operators
// ---------------------

export type ScalarValue = string | number | boolean | Date | null;

/**
 * Field-level operators for filtering.
 */
export interface FieldOps {
  /** Equal */
  $eq?: ScalarValue;
  /** Not equal */
  $neq?: ScalarValue;
  /** Greater than */
  $gt?: ScalarValue;
  /** Greater than or equal */
  $gte?: ScalarValue;
  /** Less than */
  $lt?: ScalarValue;
  /** Less than or equal */
  $lte?: ScalarValue;
  /** In set */
  $in?: ScalarValue[];
  /** Not in set */
  $nin?: ScalarValue[];
  // TODO: $all - array contains all values (e.g. tags @> ARRAY['a', 'b'])
  /** String contains */
  $contains?: string;
  /** String starts with */
  $startsWith?: string;
  /** String ends with */
  $endsWith?: string;
  /** Field exists */
  $exists?: boolean;
}

/**
 * Logical operators for combining filters.
 */
export interface LogicalOps {
  $and?: Filter[];
  $or?: Filter[];
  $not?: Filter;
}

/**
 * MongoDB-style filter expression.
 *
 * @example
 * ```ts
 * // Equality
 * { status: "active" }
 *
 * // Comparison
 * { views: { $gt: 1000 } }
 *
 * // Set membership
 * { tags: { $in: ["ai", "ml"] } }
 *
 * // Logical AND (implicit)
 * { status: "active", views: { $gte: 100 } }
 *
 * // Logical AND (explicit)
 * { $and: [{ status: "active" }, { views: { $gte: 100 } }] }
 *
 * // Logical OR
 * { $or: [{ status: "draft" }, { status: "review" }] }
 * ```
 */
export interface Filter extends LogicalOps {
  [field: string]: ScalarValue | FieldOps | Filter[] | Filter | undefined;
}

// ---------------------
// Query Input
// ---------------------

/**
 * A single ranking signal (text or vector query on a field).
 */
export interface RankingSignal {
  [field: string]: string | number[] | number | undefined;
  /** Weight for fusion (default 1.0) */
  weight?: number;
}

/**
 * Order by specification.
 */
export interface OrderBy {
  field: string;
  direction?: "asc" | "desc";
}

/**
 * Full search query options.
 */
export interface SearchQuery {
  /** Sum/RRF fusion queries (default when using array shorthand) */
  query?: RankingSignal[];
  /** Max fusion queries */
  max?: RankingSignal[];
  /** MongoDB-style filter */
  filter?: Filter;
  /** Sort order (for non-ranked queries) */
  orderBy?: OrderBy;
  /** Number of results to return */
  topK?: number;
  /** Offset for pagination */
  offset?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** Fields to include in response */
  include?: string[] | boolean;
}

/**
 * Query input - flexible format supporting multiple patterns.
 *
 * @example
 * ```ts
 * // simple single-field query
 * { content: "quick fox" }
 * { embedding: [0.1, 0.2, ...] }
 *
 * // hybrid sum fusion (array shorthand)
 * [
 *   { content: "quick fox", weight: 0.7 },
 *   { embedding: [...], weight: 0.3 },
 * ]
 *
 * // full query with max fusion and filter
 * {
 *   max: [
 *     { content: "quick fox", weight: 0.7 },
 *     { embedding: [...], weight: 0.3 },
 *   ],
 *   filter: { published: true, views: { $gt: 1000 } },
 *   topK: 20,
 * }
 *
 * // filter-only query
 * {
 *   filter: { status: "active" },
 *   orderBy: { field: "createdAt", direction: "desc" },
 *   topK: 100,
 * }
 * ```
 */
export type QueryInput = RankingSignal | RankingSignal[] | SearchQuery;

// ---------------------
// Type Guards
// ---------------------

/**
 * Normalize query input to full QueryOptions.
 *
 * @throws Error if explicit empty ranking signals are provided
 */
export function normalizeQuery(input: QueryInput): SearchQuery {
  // array shorthand → hybrid sum fusion
  if (isHybridQuery(input)) {
    if (input.length === 0) {
      throw new Error("No ranking signals provided");
    }
    return { query: input };
  }

  // single signal → wrap in array
  if (isSimpleQuery(input)) {
    return { query: [input] };
  }

  // full SearchQuery - check for explicit empty arrays
  if (Array.isArray(input.query) && input.query.length === 0) {
    throw new Error("No ranking signals provided");
  }
  if (Array.isArray(input.max) && input.max.length === 0) {
    throw new Error("No ranking signals provided");
  }

  return input;
}

/**
 * Check if query input is a simple single-field query.
 */
export function isSimpleQuery(input: QueryInput): input is RankingSignal {
  return !Array.isArray(input) && !isQueryOptions(input);
}

/**
 * Check if query input is an array (hybrid sum fusion).
 */
export function isHybridQuery(input: QueryInput): input is RankingSignal[] {
  return Array.isArray(input);
}

/**
 * Check if query input is a full query options object.
 */
export function isQueryOptions(input: QueryInput): input is SearchQuery {
  if (Array.isArray(input)) return false;
  return (
    "query" in input ||
    "max" in input ||
    "filter" in input ||
    "orderBy" in input ||
    "topK" in input
  );
}
