/**
 * Memory index handle with lazy initialization.
 * /packages/kernl/src/memory/handle.ts
 */

import {
  planQuery,
  type SearchIndex,
  type IndexHandle,
  type QueryInput,
  type SearchHit,
  type DocumentPatch,
  type UpsertResult,
  type PatchResult,
  type DeleteResult,
  type FieldSchema,
  type SearchCapabilities,
  type UnknownDocument,
} from "@kernl-sdk/retrieval";

import { getAdapterCodecs, type AdapterCodecs } from "./codecs";
import type { IndexMemoryRecord } from "./types";

/**
 * Configuration for MemoryIndexHandle.
 */
export interface MemoryIndexHandleConfig {
  /**
   * The underlying search index backend.
   */
  index: SearchIndex;

  /**
   * Index identifier (e.g., "kernl_memories_index").
   */
  indexId: string;

  /**
   * Field schema for the memory index.
   */
  schema: Record<string, FieldSchema>;

  /**
   * Backend-specific options passed to SearchIndex.createIndex().
   */
  providerOptions?: Record<string, unknown>;
}

/**
 * Domain-aware index handle for memory records with lazy initialization.
 *
 * - Wraps a SearchIndex and ensures the memory index is created before any operation.
 * - Normalizes the idiosyncrasies of search adapters (capabilities, weird rules, ... - e.g. tpuf requires vector fields named
 * literally 'vector' - dumb shit like this..)
 */
export class MemoryIndexHandle implements IndexHandle<IndexMemoryRecord> {
  readonly id: string;

  private readonly index: SearchIndex;
  private readonly schema: Record<string, FieldSchema>;
  private readonly caps: SearchCapabilities;
  private readonly codecs: AdapterCodecs;
  private readonly providerOptions?: Record<string, unknown>;

  private initPromise: Promise<void> | null = null;

  constructor(config: MemoryIndexHandleConfig) {
    this.index = config.index;
    this.id = config.indexId;
    this.schema = config.schema;
    this.caps = this.index.capabilities();
    this.codecs = getAdapterCodecs(this.index.id);
    this.providerOptions = config.providerOptions;
  }

  /**
   * Ensure memory index exists (lazy initialization).
   *
   * Safe to call multiple times - initialization only runs once.
   */
  private async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.createIndex().catch((err) => {
        this.initPromise = null;
        throw err;
      });
    }
    await this.initPromise;
  }

  /**
   * Create the memory index if it doesn't exist.
   */
  private async createIndex(): Promise<void> {
    try {
      await this.index.createIndex({
        id: this.id,
        schema: this.codecs.schema.encode(this.schema),
        providerOptions: this.providerOptions,
      });
    } catch (err: any) {
      // (TODO): we should probably enforce a stricter contract w/ tighter error types
      //
      // Ignore "already exists" errors
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("AlreadyExists") ||
        err.code === "23505" // postgres unique constraint violation
      ) {
        return;
      }
      throw err;
    }
  }

  /**
   * Search for memory records matching the query.
   *
   * Adapts the query to backend capabilities, degrading gracefully
   * when hybrid or multi-signal queries aren't supported.
   */
  async query(input: QueryInput): Promise<SearchHit<IndexMemoryRecord>[]> {
    const { input: planned } = planQuery(input, this.caps);
    const q = this.codecs.query.encode(planned);
    const handle = await this.handle();
    const hits = await handle.query(q);

    // decode hits back to IndexMemoryRecord format
    return hits.map((hit) => ({
      ...hit,
      document: hit.document
        ? this.codecs.doc.decode(hit.document as UnknownDocument)
        : undefined,
    }));
  }

  /**
   * Insert or update memory records in the index.
   */
  async upsert(
    docs: IndexMemoryRecord | IndexMemoryRecord[],
  ): Promise<UpsertResult> {
    const arr = Array.isArray(docs) ? docs : [docs];
    const encoded = arr.map((doc) => this.codecs.doc.encode(doc));
    const handle = await this.handle();
    return handle.upsert(encoded);
  }

  /**
   * Partially update memory records without re-indexing vectors.
   *
   * Note: Patches don't include vector fields so we cast directly.
   * Metadata field type mismatch (JSONObject vs FieldValue) is handled at runtime.
   */
  async patch(
    patches:
      | DocumentPatch<IndexMemoryRecord>
      | DocumentPatch<IndexMemoryRecord>[],
  ): Promise<PatchResult> {
    const handle = await this.handle();
    return handle.patch(patches as DocumentPatch<UnknownDocument>[]);
  }

  /**
   * Remove memory records from the index.
   */
  async delete(ids: string | string[]): Promise<DeleteResult> {
    const handle = await this.handle();
    return handle.delete(ids);
  }

  /**
   * Add a new field to the index schema.
   *
   * @throws Always throws - dynamic schema modification not supported
   */
  async addField(_field: string, _schema: FieldSchema): Promise<void> {
    throw new Error("addField not supported for MemoryIndexHandle");
  }

  /**
   * Get an initialized underlying index handle.
   *
   * Returns a handle typed for UnknownDocument since we encode/decode
   * through the adapter codecs for backend-specific field mapping.
   */
  private async handle(): Promise<IndexHandle<UnknownDocument>> {
    await this.ensureInit();
    return this.index.index<UnknownDocument>(this.id);
  }
}
