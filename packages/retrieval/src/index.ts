/**
 * Generic search and retrieval abstractions.
 *
 * This package provides a vendor-agnostic interface for vector search,
 * allowing implementations backed by pgvector, Turbopuffer, Pinecone, etc.
 */

export * from "./types";
export * from "./query";
export * from "./handle";
export * from "./embed";

import type { CursorPage } from "@kernl-sdk/shared";

import type {
  NewIndexParams,
  ListIndexesParams,
  IndexSummary,
  IndexStats,
  UnknownDocument,
} from "./types";
import type { IndexHandle } from "./handle";

/**
 * Generic search index interface.
 *
 * @typeParam TBindConfig - Provider-specific binding configuration type.
 *
 * Implementations can be backed by various vector databases:
 * - pgvector (Postgres)
 * - Turbopuffer
 * - Pinecone
 * - Elasticsearch
 * - etc.
 */
export interface SearchIndex<TBindConfig = unknown> {
  /**
   * Identifier for this search backend.
   * e.g. "pgvector" | "turbopuffer" | "pinecone"
   */
  readonly id: string;

  /* ---- Index lifecycle ---- */

  /**
   * Create a new index.
   */
  createIndex(params: NewIndexParams): Promise<void>;

  /**
   * List indexes with optional pagination and prefix filtering.
   */
  listIndexes(params?: ListIndexesParams): Promise<CursorPage<IndexSummary>>;

  /**
   * Get statistics about an index.
   */
  describeIndex(id: string): Promise<IndexStats>;

  /**
   * Delete an index and all its documents.
   */
  deleteIndex(id: string): Promise<void>;

  /* ---- Index handle ---- */

  /**
   * Get a handle for operating on a specific index.
   *
   * @typeParam TDocument - Shape of the document fields for typed results.
   *
   * @example
   * ```ts
   * // untyped (default)
   * const docs = search.index("docs");
   * await docs.query({ content: "quick fox" });
   *
   * // typed documents
   * interface Document { title: string; content: string; }
   * const docs = search.index<Document>("docs");
   * const hits = await docs.query({ content: "fox" });
   * hits[0].document?.title; // string | undefined
   * ```
   */
  index<TDocument = UnknownDocument>(id: string): IndexHandle<TDocument>;

  /**
   * Bind an existing resource as an index.
   *
   * Not all backends support binding. Throws if unsupported.
   */
  bindIndex(id: string, config: TBindConfig): Promise<void>;

  /* ---- Utility ---- */

  /**
   * Warm/preload an index for faster queries.
   *
   * Not all backends support warming. Throws if unsupported.
   */
  warm(id: string): Promise<void>;
}
