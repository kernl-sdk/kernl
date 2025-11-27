import type {
  Filter,
  OrderBy,
  SearchQuery,
  RankingSignal,
} from "@kernl-sdk/retrieval";

import type { PGIndexConfig } from "../types";

/**
 * Convert QueryOptions to SQL codec inputs.
 *
 * pgvector constraints:
 * - Only single vector signal supported (no multi-signal fusion)
 * - No hybrid (vector + text) in same signal
 * - Filter-only and orderBy-only queries are allowed
 */
export function sqlize(query: SearchQuery, config: SqlizeConfig): SqlizedQuery {
  const signals = query.query ?? query.max ?? [];

  // Validate pgvector constraints
  if (signals.length > 1) {
    throw new Error(
      "pgvector does not support multi-signal fusion. " +
        "Use a single vector signal, or run multiple queries and fuse client-side.",
    );
  }

  if (signals.length === 1) {
    const { weight, ...fields } = signals[0];
    let vectorCount = 0;
    let textCount = 0;

    for (const value of Object.values(fields)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) vectorCount++;
      else if (typeof value === "string") textCount++;
    }

    if (vectorCount > 1) {
      throw new Error(
        "pgvector does not support multi-vector fusion. " +
          "Use a single vector signal, or run multiple queries and fuse client-side.",
      );
    }

    if (vectorCount > 0 && textCount > 0) {
      throw new Error(
        "pgvector does not support hybrid (vector + text) fusion. " +
          "Use a single vector signal, or run multiple queries and fuse client-side.",
      );
    }
  }

  return {
    select: {
      pkey: config.pkey,
      signals,
      binding: config.binding,
      include: query.include,
    },
    where: { filter: query.filter },
    order: {
      signals,
      orderBy: query.orderBy,
      binding: config.binding,
      schema: config.schema,
      table: config.table,
    },
    limit: { topK: query.topK ?? 10, offset: query.offset ?? 0 },
  };
}

export interface SqlizedQuery {
  select: SelectInput;
  where: Omit<WhereInput, "startIdx">;
  order: OrderInput;
  limit: Omit<LimitInput, "startIdx">;
}

export interface SqlizeConfig {
  pkey: string;
  schema: string;
  table: string;
  binding?: PGIndexConfig;
}

export interface SelectInput {
  pkey: string;
  signals: RankingSignal[];
  binding?: PGIndexConfig;
  include?: string[] | boolean;
}

export interface WhereInput {
  filter?: Filter;
  startIdx: number;
}

export interface OrderInput {
  signals: RankingSignal[];
  orderBy?: OrderBy;
  binding?: PGIndexConfig;
  schema?: string;
  table?: string;
}

export interface LimitInput {
  topK: number;
  offset: number;
  startIdx: number;
}
