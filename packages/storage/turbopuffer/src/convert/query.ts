/**
 * Query conversion codecs.
 */

import type { SearchQuery, SearchHit, FieldValue } from "@kernl-sdk/retrieval";
import type {
  Row,
  NamespaceQueryParams,
} from "@turbopuffer/turbopuffer/resources/namespaces";
import type { RankBy } from "@turbopuffer/turbopuffer/resources/custom";

import { FILTER } from "./filter";

/**
 * Codec for converting SearchQuery to Turbopuffer NamespaceQueryParams.
 *
 * Note: Hybrid search (vector + text) requires multi-query which is
 * handled separately.
 */
export const QUERY = {
  encode: (query: SearchQuery): NamespaceQueryParams => {
    const params: NamespaceQueryParams = {};

    // determine ranking method
    if (query.vector) {
      params.rank_by = buildVectorRankBy(query.vector);
    } else if (query.text) {
      params.rank_by = buildTextRankBy(query.text, query.textFields);
    }

    // top K
    if (query.topK !== undefined) {
      params.top_k = query.topK;
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
        const attrs = [...query.include];
        if (query.includeVectors && !attrs.includes("vector")) {
          attrs.push("vector");
        }
        params.include_attributes = attrs;
      }
    } else if (query.includeVectors) {
      params.include_attributes = true; // include all to get vector
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
  encode: (_hit: SearchHit): Row => {
    throw new Error("SEARCH_HIT.encode: not implemented");
  },

  decode: (row: Row, index: string): SearchHit => {
    const { id, $dist, vector, ...rest } = row;

    const hit: SearchHit = {
      id: String(id),
      index,
      score: typeof $dist === "number" ? $dist : 0,
    };

    // Include vector if present
    if (vector !== undefined) {
      hit.vector = vector as number[];
    }

    // Include other fields
    if (Object.keys(rest).length > 0) {
      hit.fields = rest as Record<string, FieldValue>;
    }

    return hit;
  },
};

/**
 * Build rank_by for vector search.
 */
function buildVectorRankBy(vector: number[]): RankBy {
  return ["vector", "ANN", vector];
}

/**
 * Build rank_by for full-text search.
 */
function buildTextRankBy(text: string, fields?: string[]): RankBy {
  if (!fields || fields.length === 0) {
    throw new Error("textFields required for full-text search");
  }

  if (fields.length === 1) {
    return [fields[0], "BM25", text];
  }

  // multiple fields: combine with Sum
  const subq = fields.map((field) => [field, "BM25", text] as RankBy);
  return ["Sum", subq as never];
}
