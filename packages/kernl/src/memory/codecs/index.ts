/**
 * Memory codecs.
 *
 * Re-exports all memory codecs:
 * - Domain codecs (MEMORY_FILTER, PATCH_CODEC, recordCodec)
 * - Backend codecs (TPUF_*, IDENTITY_*)
 * - Backend codec registry (getBackendCodecs)
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldSchema,
  SearchQuery,
  UnknownDocument,
} from "@kernl-sdk/retrieval";

import type { IndexMemoryRecord } from "../types";
import { IDENTITY_DOC, IDENTITY_SCHEMA, IDENTITY_QUERY } from "./identity";
import { TPUF_DOC, TPUF_SCHEMA, TPUF_QUERY } from "./tpuf";

// re-exports
export { MEMORY_FILTER, PATCH_CODEC, recordCodec } from "./domain";
export { IDENTITY_DOC, IDENTITY_SCHEMA, IDENTITY_QUERY } from "./identity";
export { TPUF_DOC, TPUF_SCHEMA, TPUF_QUERY } from "./tpuf";

/**
 * Backend codec set.
 */
export interface AdapterCodecs {
  doc: Codec<IndexMemoryRecord, UnknownDocument>;
  schema: Codec<Record<string, FieldSchema>, Record<string, FieldSchema>>;
  query: Codec<SearchQuery, SearchQuery>;
}

/**
 * Registry of backend codecs.
 */
export const ADAPTER_CODECS: Record<string, AdapterCodecs> = {
  turbopuffer: { doc: TPUF_DOC, schema: TPUF_SCHEMA, query: TPUF_QUERY },
  pgvector: {
    doc: IDENTITY_DOC,
    schema: IDENTITY_SCHEMA,
    query: IDENTITY_QUERY,
  },
};

/**
 * Default codecs (identity) for unknown backends.
 */
const DEFAULT_CODECS: AdapterCodecs = {
  doc: IDENTITY_DOC,
  schema: IDENTITY_SCHEMA,
  query: IDENTITY_QUERY,
};

/**
 * Get codecs for a backend, falling back to identity.
 */
export function getAdapterCodecs(adapterId: string): AdapterCodecs {
  return ADAPTER_CODECS[adapterId] ?? DEFAULT_CODECS;
}
