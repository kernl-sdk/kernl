import type { FieldSchema } from "@kernl-sdk/retrieval";

/**
 * Mapping from a logical field name to a Postgres column.
 */
export interface PGFieldBinding {
  column: string;
  type: FieldSchema["type"];
  dimensions?: number;
  similarity?: "cosine" | "euclidean" | "dot_product";
}

/**
 * Configuration for binding a Postgres table as a search index.
 */
export interface PGIndexConfig {
  schema: string;
  table: string;
  pkey: string;
  fields: Record<string, PGFieldBinding>;
}
