/**
 * Generic search and retrieval abstractions.
 *
 * This package provides a vendor-agnostic interface for vector search,
 * allowing implementations backed by pgvector, Turbopuffer, Pinecone, etc.
 */

export * from "./types";

import type { CursorPage } from "@kernl-sdk/shared";

import type {
  SearchDocument,
  SearchDocumentPatch,
  SearchQuery,
  SearchHit,
  NewIndexParams,
  ListIndexesParams,
  IndexSummary,
  DescribeIndexParams,
  DeleteIndexParams,
  DeleteDocParams,
  DeleteManyParams,
  IndexStats,
} from "./types";

/**
 * Generic search index interface.
 *
 * Implementations can be backed by various vector databases:
 * - pgvector (Postgres)
 * - Turbopuffer
 * - Pinecone
 * - Elasticsearch
 * - etc.
 */
export interface SearchIndex {
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
  describeIndex(params: DescribeIndexParams): Promise<IndexStats>;

  /**
   * Delete an index and all its documents.
   */
  deleteIndex(params: DeleteIndexParams): Promise<void>;

  /* ---- Document operations ---- */

  /**
   * Upsert a single document.
   */
  upsert(document: SearchDocument): Promise<void>;

  /**
   * Upsert multiple documents.
   */
  mupsert(documents: SearchDocument[]): Promise<void>;

  /**
   * Update a document's fields.
   * null values unset the field.
   */
  update(patch: SearchDocumentPatch): Promise<void>;

  /**
   * Update multiple documents.
   */
  mupdate(patches: SearchDocumentPatch[]): Promise<void>;

  /**
   * Delete a document.
   */
  delete(params: DeleteDocParams): Promise<void>;

  /**
   * Delete multiple documents (by IDs or filter).
   */
  mdelete(params: DeleteManyParams): Promise<void>;

  /* ---- Query ---- */

  /**
   * Search for documents.
   */
  query(query: SearchQuery): Promise<SearchHit[]>;

  /* ---- Optional ---- */

  /**
   * Warm/preload an index for faster queries.
   */
  warm?(index: string): Promise<void>;
}
