/**
 * Memory index interfaces.
 *
 * Indexes are projections of the primary store (DB) that enable
 * specialized query patterns (vector search, graph traversal, archival).
 */

import type { MemoryRecord, MemorySearchQuery, MemorySearchHit } from "./types";

/**
 * Base interface for memory indexes.
 *
 * All indexes share common lifecycle operations (index, patch, delete)
 * but differ in their query interface.
 */
export interface MemoryIndexBase<TQuery, TResult> {
  /**
   * Backend identifier (e.g. "pgvector", "turbopuffer", "neo4j", "s3").
   */
  readonly id: string;

  /**
   * Query the index.
   */
  query(query: TQuery): Promise<TResult>;

  /**
   * Index a memory record (idempotent upsert).
   */
  index(record: MemoryRecord): Promise<void>;

  /**
   * Index multiple memory records.
   */
  mindex(records: MemoryRecord[]): Promise<void>;

  /**
   * Partially update a record's projection.
   */
  patch(record: MemoryRecord): Promise<void>;

  /**
   * Partially update multiple records.
   */
  mpatch(records: MemoryRecord[]): Promise<void>;

  /**
   * Remove a record from this index (DB row remains).
   */
  delete(id: string): Promise<void>;

  /**
   * Remove multiple records from this index.
   */
  mdelete(ids: string[]): Promise<void>;

  /**
   * Namespace warming / cache priming (optional).
   */
  warm?(ns: string): Promise<void>;
}

/**
 * Memory search index - vector/semantic search over memories.
 */
export interface MemorySearchIndex
  extends MemoryIndexBase<MemorySearchQuery, MemorySearchHit[]> {}

/**
 * Graph traversal query (stub).
 */
export interface GraphTraversalQuery {
  // TODO: define graph query params
  depth?: number;
}

/**
 * Graph traversal result (stub).
 */
export interface GraphTraversalResult {
  // TODO: define graph result shape
  nodes: Array<{ id: string; record?: MemoryRecord }>;
  edges: Array<{ from: string; to: string; relation: string }>;
}

/**
 * Memory graph index - relationship/graph traversal over memories (stub).
 */
export interface MemoryGraphIndex
  extends MemoryIndexBase<GraphTraversalQuery, GraphTraversalResult> {
  /**
   * Explicit traversal API (alias for query).
   */
  traverse(query: GraphTraversalQuery): Promise<GraphTraversalResult>;
}

/**
 * Archive query (stub).
 */
export interface ArchiveQuery {
  // TODO: define archive query params
  before?: number;
  collections?: string[];
}

/**
 * Archive result (stub).
 */
export interface ArchiveResult {
  // TODO: define archive result shape
  id: string;
  uri: string;
}

/**
 * Memory archive index - cold storage/archival backend (stub).
 */
export interface MemoryArchiveIndex
  extends MemoryIndexBase<ArchiveQuery, ArchiveResult[]> {}
