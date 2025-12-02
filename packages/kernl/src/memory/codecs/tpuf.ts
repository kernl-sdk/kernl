/**
 * Turbopuffer backend codecs.
 *
 * Turbopuffer constraints:
 * - Exactly one ANN vector field named "vector" per namespace.
 *
 * Memory model:
 * - IndexMemoryRecord has modality-specific vectors: tvec, ivec, avec, vvec.
 *
 * Mapping:
 * - tvec (text embedding) → vector
 * - ivec/avec/vvec are dropped (not indexed in Turbopuffer)
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldSchema,
  SearchQuery,
  RankingSignal,
  UnknownDocument,
} from "@kernl-sdk/retrieval";

import type { IndexMemoryRecord } from "../types";

/**
 * Turbopuffer document codec.
 *
 * Maps tvec → vector, drops ivec/avec/vvec.
 */
export const TPUF_DOC: Codec<IndexMemoryRecord, UnknownDocument> = {
  encode(doc: IndexMemoryRecord): UnknownDocument {
    const { tvec, ivec, avec, vvec, metadata, ...rest } = doc;
    const row: UnknownDocument = {
      ...rest,
      metadata: metadata as UnknownDocument["metadata"], // metadata is JSONObject | null, cast to FieldValue for UnknownDocument
    };
    if (tvec) row.vector = tvec;
    return row;
  },

  decode(row: UnknownDocument): IndexMemoryRecord {
    const { vector, ...rest } = row;
    return {
      ...(rest as unknown as IndexMemoryRecord),
      tvec: Array.isArray(vector) ? (vector as number[]) : undefined,
    };
  },
};

/**
 * Turbopuffer schema codec.
 *
 * Maps tvec → vector, drops ivec/avec/vvec fields.
 */
export const TPUF_SCHEMA: Codec<
  Record<string, FieldSchema>,
  Record<string, FieldSchema>
> = {
  encode(schema: Record<string, FieldSchema>): Record<string, FieldSchema> {
    const result: Record<string, FieldSchema> = {};
    for (const [name, field] of Object.entries(schema)) {
      if (name === "tvec") {
        result.vector = field;
      } else if (name === "ivec" || name === "avec" || name === "vvec") {
        continue;
      } else {
        result[name] = field;
      }
    }
    return result;
  },

  decode(): Record<string, FieldSchema> {
    throw new Error("TPUF_SCHEMA.decode not implemented");
  },
};

/**
 * Turbopuffer query codec.
 *
 * Maps tvec → vector in query signals, drops ivec/avec/vvec.
 * Operates on normalized SearchQuery (after planQuery).
 *
 * Defaults include to true so memory searches return all document attributes.
 */
export const TPUF_QUERY: Codec<SearchQuery, SearchQuery> = {
  encode(input: SearchQuery): SearchQuery {
    // default include to true for memory search (tpuf only returns id + score without it)
    const include = input.include ?? true;

    if (!input.query) {
      return { ...input, include };
    }

    const signals = input.query.map((signal: RankingSignal) => {
      const { tvec, ivec, avec, vvec, ...rest } = signal as RankingSignal & {
        tvec?: number[];
        ivec?: number[];
        avec?: number[];
        vvec?: number[];
      };

      if (tvec) {
        return { ...rest, vector: tvec };
      }
      return rest;
    });

    return { ...input, query: signals, include };
  },

  decode(): SearchQuery {
    throw new Error("TPUF_QUERY.decode not implemented");
  },
};
