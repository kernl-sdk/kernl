/**
 * Memory store interface.
 */

import type {
  MemoryRecord,
  NewMemory,
  MemoryRecordUpdate,
  MemoryListOptions,
  MemorySearchQuery,
  MemorySearchResult,
} from "./types";

/**
 * Memory persistence store.
 */
export interface MemoryStore {
  /**
   * Get a memory by ID.
   */
  get(id: string): Promise<MemoryRecord | null>;

  /**
   * List memories matching the filter.
   */
  list(options?: MemoryListOptions): Promise<MemoryRecord[]>;

  /**
   * Create a new memory.
   */
  create(memory: NewMemory): Promise<MemoryRecord>;

  /**
   * Update an existing memory.
   */
  update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord>;

  /**
   * Delete a memory.
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple memories.
   */
  mdelete(ids: string[]): Promise<void>;

  /**
   * Semantic search across memories.
   */
  search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
}
