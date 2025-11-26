/**
 * Memory store interface.
 */

import type {
  MemoryRecord,
  NewMemory,
  MemoryUpdate,
  MemoryListOptions,
} from "./types";

/**
 * Memory persistence store.
 *
 * Follows the same pattern as ThreadStore - simple CRUD operations.
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
  update(id: string, patch: MemoryUpdate): Promise<MemoryRecord>;

  /**
   * Delete a memory.
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple memories.
   */
  mdelete(ids: string[]): Promise<void>;
}
