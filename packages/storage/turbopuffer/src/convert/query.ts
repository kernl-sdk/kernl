/**
 * Query conversion codecs.
 *
 * Converts the new RankingSignal-based query format to Turbopuffer params.
 */

import type {
  SearchQuery,
  SearchHit,
  RankingSignal,
  UnknownDocument,
} from "@kernl-sdk/retrieval";
import type {
  Row,
  NamespaceQueryParams,
} from "@turbopuffer/turbopuffer/resources/namespaces";
import type { RankBy } from "@turbopuffer/turbopuffer/resources/custom";

import { FILTER } from "./filter";

/**
 * Codec for converting SearchQuery to Turbopuffer NamespaceQueryParams.
 */
export const QUERY = {
  encode: (query: SearchQuery): NamespaceQueryParams => {
    const params: NamespaceQueryParams = {};

    // Build rank_by from query signals
    const signals = query.query ?? query.max;
    if (signals && signals.length > 0) {
      params.rank_by = buildRankBy(signals, query.max !== undefined);
    }

    // limit
    if (query.limit !== undefined) {
      params.top_k = query.limit;
    }

    // filters
    if (query.filter) {
      params.filters = FILTER.encode(query.filter);
    }

    // include attributes
    if (query.include !== undefined) {
      if (typeof query.include === "boolean") {
        params.include_attributes = query.include;
      } else {
        params.include_attributes = [...query.include];
      }
    }

    return params;
  },

  decode: (_params: NamespaceQueryParams): SearchQuery => {
    throw new Error("QUERY.decode: not implemented");
  },
};

/**
 * Codec for converting Turbopuffer Row to SearchHit.
 */
export const SEARCH_HIT = {
  encode: <TDocument = UnknownDocument>(_hit: SearchHit<TDocument>): Row => {
    throw new Error("SEARCH_HIT.encode: not implemented");
  },

  decode: <TDocument = UnknownDocument>(
    row: Row,
    index: string,
  ): SearchHit<TDocument> => {
    const { id, $dist, ...rest } = row;

    const dist = typeof $dist === "number" ? $dist : 0;

    const hit: SearchHit<TDocument> = {
      id: String(id),
      index,
      score: dist === 0 ? 0 : -dist, // convert distance to similarity (negate so higher = better)
    };

    // include document fields with id
    hit.document = { id, ...rest } as unknown as Partial<TDocument>;

    return hit;
  },
};

/**
 * Build rank_by from ranking signals.
 *
 * Turbopuffer constraints:
 * - Sum/Max fusion only works with BM25 (text) signals
 * - Vector search must be a single ANN query
 * - Hybrid (text + vector) fusion is not supported in a single query
 */
function buildRankBy(signals: RankingSignal[], useMax: boolean): RankBy {
  const textRankBys: RankBy[] = [];
  const vectorRankBys: RankBy[] = [];

  for (const signal of signals) {
    const { weight, ...fields } = signal;
    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined) continue;

      if (Array.isArray(value)) {
        vectorRankBys.push(["vector", "ANN", value as number[]]);
      } else if (typeof value === "string") {
        textRankBys.push([field, "BM25", value]);
      }
    }
  }

  const hasVector = vectorRankBys.length > 0;
  const hasText = textRankBys.length > 0;

  if (!hasVector && !hasText) {
    throw new Error("No ranking signals provided");
  }

  // hybrid fusion not supported
  if (hasVector && hasText) {
    throw new Error(
      "Turbopuffer does not support hybrid (vector + text) fusion in a single query. " +
        "Use separate queries and merge results client-side.",
    );
  }

  // multi-vector fusion not supported
  if (vectorRankBys.length > 1) {
    throw new Error(
      "Turbopuffer does not support multi-vector fusion. " +
        "Use separate queries and merge results client-side.",
    );
  }

  // single vector query
  if (hasVector) {
    return vectorRankBys[0];
  }

  // single text query
  if (textRankBys.length === 1) {
    return textRankBys[0];
  }

  // multiple text signals: use Sum or Max fusion
  const fusion = useMax ? "Max" : "Sum";
  return [fusion, textRankBys] as RankBy;
}
