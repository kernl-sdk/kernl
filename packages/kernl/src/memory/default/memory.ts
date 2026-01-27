import type { IndexHandle } from "@kernl-sdk/retrieval";
import type { AsyncCodec } from "@kernl-sdk/shared/lib";

import type { MemoryStore } from "../store";
import type {
  NewMemory,
  MemoryRecord,
  MemoryRecordUpdate,
  MemoryScope,
  MemoryConfig,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryListOptions,
  MemoryByteCodec,
  IndexMemoryRecord,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
  MemoryReindexParams,
} from "../types";
import { MEMORY_FILTER, PATCH_CODEC, recordCodec } from "./codecs";

/**
 * Memory is the default composite MemoryStore implementation.
 *
 * Composes a raw storage backend with optional vector search index and
 * embedding encoder. This is the implementation you get when configuring
 * Kernl with storage.db + storage.vector + memory.embedding.
 *
 * For external providers (e.g., Supermemory), implement MemoryStore directly.
 *
 * Memory layers:
 *  - L1 / wmem: active working set exposed to the model
 *  - L2 / smem: bounded recent context with a TTL
 *  - L3 / lmem: durable, structured long-term store
 */
export class Memory implements MemoryStore {
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
   * Get a memory by ID.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    return this.store.get(id);
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
  async update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord> {
    const record = await this.store.update(id, patch);
    if (!this._search) return record;

    if (patch.content) {
      const indexed = await this.rcodec.encode(record); // content changed → full re-index with new embeddings
      await this._search.upsert(indexed);
    } else {
      await this._search.patch({ id, ...PATCH_CODEC.encode(patch) }); // metadata only → cheap patch
    }

    return record;
  }

  /**
   * Semantic/metadata search across memories.
   *
   * Sends rich query with both text and vector - the index handle
   * adapts based on backend capabilities (e.g. drops text for pgvector).
   */
  async search(q: MemorySearchQuery): Promise<MemorySearchResult[]> {
    if (!this._search) {
      throw new Error("search index not configured");
    }

    const tvec = await this.encoder.embed(q.query);

    const hits = await this._search.query({
      query: [{ text: q.query, tvec: tvec ?? undefined }],
      filter: q.filter ? MEMORY_FILTER.encode(q.filter) : undefined,
      limit: q.limit ?? 20,
    });

    // (TODO): Avoid hydration by storing full record fields in the index.
    // Hydrate full records from store
    const results = await Promise.all(
      hits.map(async (hit) => {
        const id = hit.document?.id;
        if (!id) {
          throw new Error("search hit missing document id");
        }
        const record = await this.store.get(id);
        if (!record) {
          throw new Error(`memory not found in store: ${id}`);
        }
        return { record, score: hit.score };
      }),
    );
    return results;
  }

  /**
   * List memories matching the filter.
   */
  async list(options?: MemoryListOptions): Promise<MemoryRecord[]> {
    return this.store.list(options);
  }

  /**
   * Delete a memory by ID.
   */
  async delete(id: string): Promise<void> {
    await this.store.delete(id);
    if (this._search) {
      await this._search.delete(id);
    }
  }

  /**
   * Delete multiple memories by ID.
   */
  async mdelete(ids: string[]): Promise<void> {
    await this.store.mdelete(ids);
    if (this._search) {
      await Promise.all(ids.map((id) => this._search!.delete(id)));
    }
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
