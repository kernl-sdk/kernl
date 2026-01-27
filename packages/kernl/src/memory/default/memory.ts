import type { IndexHandle } from "@kernl-sdk/retrieval";
import type { AsyncCodec } from "@kernl-sdk/shared/lib";

import type { BaseToolkit } from "../../tool";
import {
  type MemoryStore,
  type MemoryProvider,
  BaseMemorySnapshot,
} from "../interface";
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
  MemoryReindexParams,
} from "./types";
import { MEMORY_FILTER, PATCH_CODEC, recordCodec } from "./codecs";

// -----------------------------------------------------------------------------
// Memory
// -----------------------------------------------------------------------------

/**
 * Memory is the default composite MemoryProvider implementation.
 *
 * Composes a raw storage backend with optional vector search index and
 * embedding encoder. This is the implementation you get when configuring
 * Kernl with storage.db + storage.vector + memory.embedding.
 *
 * For external providers (e.g., Supermemory), implement MemoryProvider directly.
 *
 * Memory layers:
 *  - L1 / wmem: active working set exposed to the model
 *  - L2 / smem: bounded recent context with a TTL
 *  - L3 / lmem: durable, structured long-term store
 */
export class Memory
  implements MemoryProvider<DefaultMemorySnapshot, DefaultMemorySnapshot>
{
  private readonly store: MemoryStore;
  private readonly _search: IndexHandle<IndexMemoryRecord> | null;

  private readonly encoder: MemoryByteCodec;
  private readonly rcodec: AsyncCodec<MemoryRecord, IndexMemoryRecord>;

  constructor(config: MemoryConfig) {
    this.store = config.store;
    this._search = config.search ?? null;

    this.encoder = config.encoder;
    this.rcodec = recordCodec(config.encoder);
  }

  // ---------------------------------------------------------------------------
  // MemoryStore (persistence) methods
  // ---------------------------------------------------------------------------

  async get(id: string): Promise<MemoryRecord | null> {
    return this.store.get(id);
  }

  async list(options?: MemoryListOptions): Promise<MemoryRecord[]> {
    return this.store.list(options);
  }

  async create(memory: NewMemory): Promise<MemoryRecord> {
    const record = await this.store.create(memory);

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

  async delete(id: string): Promise<void> {
    await this.store.delete(id);
    if (this._search) {
      await this._search.delete(id);
    }
  }

  async mdelete(ids: string[]): Promise<void> {
    await this.store.mdelete(ids);
    if (this._search) {
      await Promise.all(ids.map((id) => this._search!.delete(id)));
    }
  }

  // ---------------------------------------------------------------------------
  // MemoryProvider methods
  // ---------------------------------------------------------------------------

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
   * Working memory loader.
   */
  wmem = {
    load: async (scope: MemoryScope): Promise<DefaultMemorySnapshot> => {
      const records = await this.store.list({
        filter: { scope, wmem: true },
      });
      return new DefaultMemorySnapshot(scope, records);
    },
  };

  /**
   * Short-term memory loader.
   */
  smem = {
    load: async (scope: MemoryScope): Promise<DefaultMemorySnapshot> => {
      const records = await this.store.list({
        filter: { scope, smem: true },
      });
      return new DefaultMemorySnapshot(scope, records);
    },
  };

  /**
   * Default memory tools.
   * TODO: Implement remember, recall, forget tools
   */
  tools(): BaseToolkit<any>[] {
    return [];
  }

  /**
   * Initialize the memory provider.
   */
  async init(): Promise<void> {
    // No-op - storage init happens elsewhere
  }

  /**
   * Close the memory provider.
   */
  async close(): Promise<void> {
    // No-op - storage close happens elsewhere
  }

  // ---------------------------------------------------------------------------
  // Additional methods (not part of interface)
  // ---------------------------------------------------------------------------

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
}

/**
 * Default memory context implementation.
 *
 * Renders MemoryRecord[] into various formats for prompt injection.
 */
export class DefaultMemorySnapshot extends BaseMemorySnapshot<MemoryRecord> {
  txt(): string {
    if (this.records.length === 0) return "";
    return this.records
      .map((r) => {
        const content = r.content.text ?? JSON.stringify(r.content.object);
        return `- ${content}`;
      })
      .join("\n");
  }

  md(): string {
    if (this.records.length === 0) return "";
    return this.records
      .map((r) => {
        const content = r.content.text ?? JSON.stringify(r.content.object);
        const collection = r.collection ? ` [${r.collection}]` : "";
        return `- ${content}${collection}`;
      })
      .join("\n");
  }

  yml(): string {
    if (this.records.length === 0) return "";
    const items = this.records.map((r) => ({
      id: r.id,
      collection: r.collection,
      content: r.content.text ?? r.content.object,
    }));
    return items
      .map(
        (item) =>
          `- id: ${item.id}\n  collection: ${item.collection ?? "null"}\n  content: ${typeof item.content === "string" ? item.content : JSON.stringify(item.content)}`,
      )
      .join("\n");
  }
}
