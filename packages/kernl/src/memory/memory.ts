import type { IndexHandle, SearchHit } from "@kernl-sdk/retrieval";
import type { AsyncCodec } from "@kernl-sdk/shared/lib";

import type { MemoryStore } from "./store";
import type {
  NewMemory,
  MemoryRecord,
  MemoryRecordUpdate,
  MemoryScope,
  MemoryConfig,
  MemorySearchQuery,
  MemoryByteCodec,
  IndexMemoryRecord,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
  MemoryReindexParams,
} from "./types";
import { MEMORY_FILTER, PATCH_CODEC, recordCodec } from "./codecs";

/**
 * Memory is the primary memory abstraction for agents.
 *
 * Sits above storage/index layers + owns cognitive policy, eviction/TTL, consolidation.
 *
 *  - L1 / wmem: active working set exposed to the model
 *  - L2 / smem: bounded recent context with a TTL
 *  - L3 / lmem: durable, structured long-term store
 *
 * Delegates persistence to storage adapters and optional indexes as
 * _projections_ of the primary memory store.
 */
export class Memory {
  private readonly store: MemoryStore;
  private readonly _search: IndexHandle<IndexMemoryRecord> | null;

  private readonly encoder: MemoryByteCodec;
  private readonly rcodec: AsyncCodec<MemoryRecord, IndexMemoryRecord>;

  constructor(config: MemoryConfig) {
    this.store = config.store;
    this._search = config.search ?? null;

    // TODO: default encoder using text-embedding-3-small
    this.encoder = config.encoder;
    this.rcodec = recordCodec(config.encoder);
  }

  /**
   * Create a new memory record.
   * Writes to primary store first, then indexes if configured.
   */
  async create(memory: NewMemory): Promise<MemoryRecord> {
    const record = await this.store.create(memory);

    // index into search if avail
    if (this._search) {
      const indexed = await this.rcodec.encode(record);
      await this._search.upsert(indexed);
    }

    return record;
  }

  /**
   * Update an existing memory record.
   * Updates primary store, then re-indexes or patches search index.
   */
  async update(update: MemoryRecordUpdate): Promise<MemoryRecord> {
    const record = await this.store.update(update.id, update);
    if (!this._search) return record;

    if (update.content) {
      const indexed = await this.rcodec.encode(record); // content changed → full re-index with new embeddings
      await this._search.upsert(indexed);
    } else {
      const patch = PATCH_CODEC.encode(update); // metadata only → cheap patch
      await this._search.patch(patch);
    }

    return record;
  }

  /**
   * Semantic/metadata search across memories.
   *
   * Sends rich query with both text and vector - the index handle
   * adapts based on backend capabilities (e.g. drops text for pgvector).
   */
  async search(q: MemorySearchQuery): Promise<SearchHit<IndexMemoryRecord>[]> {
    if (!this._search) {
      throw new Error("search index not configured");
    }

    const tvec = await this.encoder.embed(q.query);

    return this._search.query({
      query: [{ text: q.query, tvec }],
      filter: q.filter ? MEMORY_FILTER.encode(q.filter) : undefined,
      topK: q.limit ?? 20,
    });
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
      const indexed = await this.rcodec.encode(record);
      await this._search.upsert(indexed);
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
