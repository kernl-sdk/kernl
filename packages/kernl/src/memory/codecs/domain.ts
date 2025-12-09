/**
 * Domain-level memory codecs.
 *
 * Codecs for transforming between memory domain types and search/index formats.
 */

import type { Codec, AsyncCodec } from "@kernl-sdk/shared/lib";
import type { Filter as SearchFilter } from "@kernl-sdk/retrieval";

import type {
  MemoryFilter,
  MemoryRecord,
  MemoryRecordUpdate,
  IndexMemoryRecord,
  IndexMemoryRecordPatch,
  MemoryByteCodec,
} from "../types";

/**
 * Codec for converting MemoryFilter to retrieval Filter.
 *
 * - scope.namespace → namespace
 * - scope.entityId → entityId
 * - scope.agentId → agentId
 * - collections → collection: { $in: [...] }
 * - after/before → timestamp: { $gt/$lt }
 *
 * Content field filtering (text, metadata, kind) is not currently supported.
 * Text relevance is handled via vector similarity in the query, not filters.
 */
export const MEMORY_FILTER: Codec<MemoryFilter, SearchFilter> = {
  encode(mf: MemoryFilter): SearchFilter {
    const sf: SearchFilter = {};

    // scope
    if (mf.scope?.namespace !== undefined) sf.namespace = mf.scope.namespace;
    if (mf.scope?.entityId !== undefined) sf.entityId = mf.scope.entityId;
    if (mf.scope?.agentId !== undefined) sf.agentId = mf.scope.agentId;

    if (mf.collections && mf.collections.length > 0) {
      sf.collection = { $in: mf.collections };
    }

    if (mf.after !== undefined || mf.before !== undefined) {
      const ts: { $gt?: number; $lt?: number } = {};
      if (mf.after !== undefined) ts.$gt = mf.after;
      if (mf.before !== undefined) ts.$lt = mf.before;
      sf.timestamp = ts;
    }

    return sf;
  },

  decode(_filter: SearchFilter): MemoryFilter {
    throw new Error("MEMORY_FILTER.decode not implemented");
  },
};

/**
 * Create a codec for MemoryRecord -> IndexMemoryRecord.
 *
 * Combines:
 * - Record scope/timestamps from MemoryRecord
 * - Indexed content (text, object projection, embeddings) from byte codec
 *
 * Note: metadata is NOT included - it lives in the primary DB only.
 */
export function recordCodec(
  bytecodec: MemoryByteCodec,
): AsyncCodec<MemoryRecord, IndexMemoryRecord> {
  return {
    async encode(record: MemoryRecord): Promise<IndexMemoryRecord> {
      const indexable = await bytecodec.encode(record.content);
      return {
        id: record.id,
        namespace: record.scope.namespace ?? null,
        entityId: record.scope.entityId ?? null,
        agentId: record.scope.agentId ?? null,
        kind: record.kind,
        collection: record.collection,
        timestamp: record.timestamp,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...indexable,
      };
    },
    async decode(): Promise<MemoryRecord> {
      throw new Error("recordCodec.decode not implemented");
    },
  };
}

/**
 * Codec for converting MemoryRecordUpdate to IndexMemoryRecordPatch.
 *
 * Maps patchable fields from domain update to index patch format.
 * wmem/smem are store-only fields and are not included.
 * content changes require full re-index, not a patch.
 */
export const PATCH_CODEC: Codec<MemoryRecordUpdate, IndexMemoryRecordPatch> = {
  encode(update: MemoryRecordUpdate): IndexMemoryRecordPatch {
    const patch: IndexMemoryRecordPatch = { id: update.id };

    if (update.scope?.namespace !== undefined)
      patch.namespace = update.scope.namespace;
    if (update.scope?.entityId !== undefined)
      patch.entityId = update.scope.entityId;
    if (update.scope?.agentId !== undefined)
      patch.agentId = update.scope.agentId;
    if (update.collection !== undefined) patch.collection = update.collection;
    if (update.timestamp !== undefined) patch.timestamp = update.timestamp;
    if (update.updatedAt !== undefined) patch.updatedAt = update.updatedAt;
    if (update.metadata !== undefined) patch.metadata = update.metadata;

    return patch;
  },

  decode(_patch: IndexMemoryRecordPatch): MemoryRecordUpdate {
    throw new Error("PATCH_CODEC.decode not implemented");
  },
};
