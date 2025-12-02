import { FieldValue, SearchHit, UnknownDocument } from "@kernl-sdk/retrieval";

import type { PGIndexConfig } from "./types";

/**
 * Codec for converting DB row ←→ SearchHit.
 */
export const SEARCH_HIT = {
  encode: (_hit: SearchHit): Record<string, unknown> => {
    throw new Error("SEARCH_HIT.encode: not implemented");
  },

  decode: <TDocument = UnknownDocument>(
    row: Record<string, unknown>,
    index: string,
    config?: PGIndexConfig,
  ): SearchHit<TDocument> => {
    const { id, score, ...rest } = row;
    const doc: Record<string, FieldValue> = {};

    // Helper to parse pgvector strings like "[0.1,0.2,0.3]" back to arrays
    const parseValue = (val: unknown, isVector: boolean): FieldValue => {
      if (isVector && typeof val === "string" && val.startsWith("[")) {
        return JSON.parse(val);
      }
      return val as FieldValue;
    };

    if (config) {
      // map columns back to logical field names
      for (const [field, cfg] of Object.entries(config.fields)) {
        const col = cfg.column;
        if (col in rest) {
          const isVector = cfg.type === "vector";
          doc[field] = parseValue(rest[col], isVector);
        }
      }
    } else {
      // no config - parse all values, detecting vectors by format
      for (const [k, v] of Object.entries(rest)) {
        const isVector = typeof v === "string" && v.startsWith("[") && v.endsWith("]");
        doc[k] = parseValue(v, isVector);
      }
    }

    // Always include id in document for consistency
    doc.id = String(id);

    return {
      id: String(id),
      index,
      score: typeof score === "number" ? score : 0,
      document: doc as unknown as Partial<TDocument>,
    };
  },
};
