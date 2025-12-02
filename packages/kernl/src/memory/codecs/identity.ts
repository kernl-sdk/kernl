/**
 * Identity codecs - pass through unchanged.
 *
 * Used for backends that support the full IndexMemoryRecord schema natively.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { FieldSchema, SearchQuery, UnknownDocument } from "@kernl-sdk/retrieval";

import type { IndexMemoryRecord } from "../types";

export const IDENTITY_DOC: Codec<IndexMemoryRecord, UnknownDocument> = {
  encode: (doc) => doc as unknown as UnknownDocument,
  decode: (row) => row as unknown as IndexMemoryRecord,
};

export const IDENTITY_SCHEMA: Codec<
  Record<string, FieldSchema>,
  Record<string, FieldSchema>
> = {
  encode: (schema) => schema,
  decode: (schema) => schema,
};

export const IDENTITY_QUERY: Codec<SearchQuery, SearchQuery> = {
  encode: (q) => q,
  decode: (q) => q,
};
