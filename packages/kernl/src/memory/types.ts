/**
 * Memory types.
 */

import type { JSONObject } from "@kernl-sdk/protocol";
import type { AsyncCodec } from "@kernl-sdk/shared/lib";
import type { IndexHandle } from "@kernl-sdk/retrieval";

import type { MemoryStore } from "./store";

// -------------------
// Byte types
// -------------------

export type TextByte = string;

/**
 * Image content.
 *
 * NOTE: Parallels @kernl-sdk/protocol's FilePart type.
 * @see packages/protocol/src/language-model/item.ts
 */
export interface ImageByte {
  data: Uint8Array | string; // raw bytes or base64/URI
  mime: string; // "image/png", "image/jpeg", etc.
  alt?: string; // alt text / description
}

/**
 * Audio content.
 */
export interface AudioByte {
  data: Uint8Array | string;
  mime: string; // "audio/wav", "audio/mp3", etc.
}

/**
 * Video content.
 */
export interface VideoByte {
  data: Uint8Array | string;
  mime: string;
}

/**
 * Memory content - the smallest coherent unit of memory.
 *
 * May contain multiple modalities (e.g., captioned image, video with transcript).
 * At most one of each modality type.
 */
export interface MemoryByte {
  text?: TextByte;
  image?: ImageByte;
  audio?: AudioByte;
  video?: VideoByte;
  object?: JSONObject;
}

/**
 * Search-ready projection of a MemoryByte.
 *
 * Contains canonical text plus embeddings for each modality.
 * Note: metadata is NOT included - it lives in the primary DB only.
 */
export interface IndexableByte {
  text?: string; // canonical semantic text
  objtext?: string; // string projection of object for indexing (not full JSON)
  tvec?: number[]; // text embedding
  ivec?: number[]; // image embedding
  avec?: number[]; // audio embedding
  vvec?: number[]; // video embedding
}

/**
 * Encoder that converts MemoryByte to IndexableByte with embeddings.
 */
export interface MemoryByteCodec extends AsyncCodec<MemoryByte, IndexableByte> {
  /**
   * Embed a text string.
   *
   * @returns Embedding vector, or null if no embedder configured.
   */
  embed(text: string): Promise<number[] | null>;
}

// -------------------
// Config & snapshots
// -------------------

export interface MemoryConfig {
  store: MemoryStore;
  search?: IndexHandle<IndexMemoryRecord>;
  // graph?: MemoryGraphIndex;
  // archive?: MemoryArchiveIndex;

  /** Encoder for converting MemoryByte to IndexableByte with embeddings. */
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

/**
 * Memory scope - identifies who/what this memory belongs to.
 */
export interface MemoryScope {
  namespace?: string;
  entityId?: string;
  agentId?: string;
}

/**
 * Memory kind - episodic (events/experiences) or semantic (facts/knowledge).
 */
export type MemoryKind = "episodic" | "semantic";

/**
 * Input for creating a new memory.
 */
export interface NewMemory {
  id: string;
  scope: MemoryScope;
  kind: MemoryKind;
  collection?: string;
  content: MemoryByte;
  wmem?: boolean;
  smem?: { expiresAt: number | null };
  timestamp?: number;
  metadata?: JSONObject | null;
}

/**
 * Simplified input for agent-scoped memory creation.
 *
 * Sugar over NewMemory with:
 * - id auto-generated if not provided
 * - scope fields flattened (namespace, entityId) - agentId is implicit
 * - kind defaults to "semantic"
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
 *
 * Allows updating content, collection, and memory layer flags.
 * Scope (namespace, entityId, agentId) cannot be changed after creation.
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
 * Base memory record fields.
 */
interface BaseMemoryRecord {
  id: string;
  scope: MemoryScope;
  kind: MemoryKind;
  collection: string | null;
  content: MemoryByte;
  wmem: boolean;
  smem: { expiresAt: number | null };
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  metadata: JSONObject | null;
}

/**
 * Episodic memory - events, experiences, conversations.
 */
export interface EpisodicMemoryRecord extends BaseMemoryRecord {
  kind: "episodic";
}

/**
 * Semantic memory - facts, knowledge, learned information.
 */
export interface SemanticMemoryRecord extends BaseMemoryRecord {
  kind: "semantic";
}

/**
 * A persisted memory record.
 */
export type MemoryRecord = EpisodicMemoryRecord | SemanticMemoryRecord;

/**
 * Update payload for a memory record.
 */
export interface MemoryRecordUpdate {
  id: string;
  scope?: MemoryScope;
  collection?: string;
  content?: MemoryByte;
  wmem?: boolean;
  smem?: { expiresAt: number | null };
  timestamp?: number;
  updatedAt?: number;
  metadata?: JSONObject | null;
}

/**
 * Filter for listing memories.
 */
export interface MemoryFilter {
  scope?: Partial<MemoryScope>;
  collections?: string[];
  wmem?: boolean;
  smem?: boolean;
  after?: number;
  before?: number;
  metadata?: JSONObject;
}

/**
 * Options for listing memories.
 */
export interface MemoryListOptions {
  filter?: MemoryFilter;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
}

/**
 * Query for semantic memory search.
 */
export interface MemorySearchQuery {
  query: string;
  filter?: MemoryFilter;
  limit?: number;
}

/**
 * Params for triggering reindexing of a memory record.
 */
export interface MemoryReindexParams {
  id: string;
  indexes?: ("search" | "graph" | "archive")[];
}

// -------------------
// Index types
// -------------------

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
 * Content changes require full re-index, not a patch.
 */
export interface IndexMemoryRecordPatch {
  id: string;
  namespace?: string | null;
  entityId?: string | null;
  agentId?: string | null;
  collection?: string;
  timestamp?: number;
  updatedAt?: number;
}
