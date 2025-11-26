import type { MemoryStore } from "./store";
import type { MemorySearchIndex } from "./indexes";
import type {
  NewMemory,
  MemoryRecord,
  MemoryScope,
  MemoryConfig,
  MemorySearchHit,
  MemorySearchQuery,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
  MemoryReindexParams,
} from "./types";

/**
 * Memory is the primary memory abstraction for agents.
 *
 * Sits above storage/index layers + owns cognitive policy, eviction/TTL, consolidation.
 *
 *  - L1 / wmem: active working set exposed to the model
 *  - L2 / smem: bounded recent context that can refill working memory
 *  - L3 / lmem: durable, structured long-term store
 *
 * Delegates persistence to storage adapters and optional indexes as _projections_ of the primary
 * memory store.
 */
export class Memory {
  private readonly store: MemoryStore;
  private readonly _search: MemorySearchIndex | null;

  constructor(config: MemoryConfig) {
    this.store = config.store;
    this._search = config.search ?? null;
  }

  /**
   * Create a new memory record.
   * Writes to primary store first, then indexes if configured.
   */
  async create(memory: NewMemory): Promise<MemoryRecord> {
    const record = await this.store.create(memory);

    if (this._search) {
      await this._search.index(record); // no-op for pgvector
    }

    return record;
  }

  /**
   * Semantic/metadata search across memories.
   */
  async search(query: MemorySearchQuery): Promise<MemorySearchHit[]> {
    if (!this._search) {
      throw new Error("search index not configured");
    }
    return this._search.query(query);
  }

  /**
   * Repair indexing for a memory without modifying the DB row.
   */
  async reindex(params: MemoryReindexParams): Promise<void> {
    const record = await this.store.get(params.id);
    if (!record) {
      throw new Error(`memory not found: ${params.id}`);
    }

    const indexes = params.indexes ?? ["search", "graph", "archive"];

    if (indexes.includes("search") && this._search) {
      await this._search.index(record);
    }
  }

  /* --- (TODO): unclear what the shape of these should be.. --- */

  /**
   * Load working memory (L1) - wmem-pinned memories for the scope.
   */
  async loadWorkingMemory(scope: MemoryScope): Promise<WorkingMemorySnapshot> {
    const records = await this.store.list({
      filter: { scope, wmem: true },
    });
    return { scope, records };
  }

  /**
   * Load short-term memory (L2) - active smem for the scope.
   */
  async loadShortTermMemory(
    scope: MemoryScope,
  ): Promise<ShortTermMemorySnapshot> {
    const records = await this.store.list({
      filter: { scope, smem: true },
    });
    return { scope, records };
  }
}
