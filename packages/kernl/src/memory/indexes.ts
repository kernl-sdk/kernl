/**
 * Memory index interfaces.
 * /packages/kernl/src/memory/indexes.ts
 *
 * Indexes are projections of the primary store (DB) that enable
 * specialized query patterns (vector search, graph traversal, archival).
 */

import type { SearchHit } from "@kernl-sdk/retrieval";

import type {
  MemoryRecord,
  MemoryRecordUpdate,
  MemorySearchQuery,
  IndexMemoryRecord,
} from "./types";

/**
 * Base interface for memory indexes.
 *
 * All indexes share common lifecycle operations (index, patch, delete)
 * but differ in their query interface.
 */
export interface MemoryIndexBase<TQuery, TResult> {
  readonly id: string /* provider id - "pgvector" | "turbopuffer", ... */;

  /**
   * Query the index.
   */
  query(query: TQuery): Promise<TResult>;

  /**
   * Index one or more memory records (idempotent upsert).
   */
  index(memories: MemoryRecord | MemoryRecord[]): Promise<void>;

  /**
   * Partially update one or more records' projections.
   */
  update(updates: MemoryRecordUpdate | MemoryRecordUpdate[]): Promise<void>;

  /**
   * Remove one or more records from this index (DB row remains).
   */
  delete(ids: string | string[]): Promise<void>;

  /**
   * Index warming (optional).
   */
  warm(index: string): Promise<void>;
}

/**
 * Memory search index - vector/semantic search over memories.
 */
export interface MemorySearchIndex
  extends MemoryIndexBase<MemorySearchQuery, SearchHit<IndexMemoryRecord>[]> {}

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
