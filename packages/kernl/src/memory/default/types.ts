/**
 * Memory types for the default implementation.
 *
 * Re-exports core types and adds implementation-specific types
 * for indexing, encoding, etc.
 */

import type { AsyncCodec } from "@kernl-sdk/shared/lib";
import type { IndexHandle } from "@kernl-sdk/retrieval";
import type { JSONObject } from "@kernl-sdk/protocol";

import type { MemoryStore, MemoryByte, MemoryScope, MemoryKind, MemoryRecord } from "../interface";

// Re-export core types
export type {
  TextByte,
  ImageByte,
  AudioByte,
  VideoByte,
  MemoryByte,
  MemoryScope,
  MemoryKind,
  EpisodicMemoryRecord,
  SemanticMemoryRecord,
  MemoryRecord,
  NewMemory,
  MemoryRecordUpdate,
  MemoryFilter,
  MemoryListOptions,
  MemorySearchQuery,
  MemorySearchResult,
} from "../interface";

// -----------------------------------------------------------------------------
// Indexable types (kernl-specific)
// -----------------------------------------------------------------------------

/**
 * Search-ready projection of a MemoryByte.
 *
 * Contains canonical text plus embeddings for each modality.
 * Note: metadata is NOT included - it lives in the primary DB only.
 */
export interface IndexableByte {
  text?: string;
  objtext?: string;
  tvec?: number[];
  ivec?: number[];
  avec?: number[];
  vvec?: number[];
}

/**
 * Encoder that converts MemoryByte to IndexableByte with embeddings.
 */
export interface MemoryByteCodec extends AsyncCodec<MemoryByte, IndexableByte> {
  embed(text: string): Promise<number[] | null>;
}

// -----------------------------------------------------------------------------
// Config & snapshots (kernl-specific)
// -----------------------------------------------------------------------------

/**
 * Configuration for the default Memory implementation.
 */
export interface MemoryConfig {
  store: MemoryStore;
  search?: IndexHandle<IndexMemoryRecord>;
  encoder: MemoryByteCodec;
}

/**
 * Working memory snapshot (L1).
 */
export interface WorkingMemorySnapshot {
  scope: MemoryScope;
  records: MemoryRecord[];
}

/**
 * Short-term memory snapshot (L2).
 */
export interface ShortTermMemorySnapshot {
  scope: MemoryScope;
  records: MemoryRecord[];
}

// -----------------------------------------------------------------------------
// Agent sugar types (kernl-specific)
// -----------------------------------------------------------------------------

/**
 * Simplified input for agent-scoped memory creation.
 */
export interface AgentMemoryCreate {
  id?: string;
  namespace?: string;
  entityId?: string;
  collection?: string;
  content: MemoryByte;
  wmem?: boolean;
  smem?: { expiresAt: number | null };
  timestamp?: number;
  metadata?: JSONObject | null;
}

/**
 * Simplified input for agent-scoped memory updates.
 */
export interface AgentMemoryUpdate {
  id: string;
  content?: MemoryByte;
  collection?: string;
  wmem?: boolean;
  smem?: { expiresAt: number | null };
  metadata?: JSONObject | null;
}

/**
 * Params for triggering reindexing of a memory record.
 */
export interface MemoryReindexParams {
  id: string;
  indexes?: ("search" | "graph" | "archive")[];
}

// -----------------------------------------------------------------------------
// Index types (kernl-specific)
// -----------------------------------------------------------------------------

/**
 * Flat document for search indexes.
 */
export interface IndexMemoryRecord extends IndexableByte {
  id: string;
  namespace: string | null;
  entityId: string | null;
  agentId: string | null;
  kind: MemoryKind;
  collection: string | null;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Patch payload for updating an IndexMemoryRecord.
 */
export interface IndexMemoryRecordPatch {
  namespace?: string | null;
  entityId?: string | null;
  agentId?: string | null;
  collection?: string;
  timestamp?: number;
  updatedAt?: number;
}
