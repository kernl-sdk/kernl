/**
 * Memory types.
 */

import type { JSONObject } from "@kernl-sdk/protocol";

import { MemoryStore } from "./store";
import { MemorySearchIndex } from "./indexes";
import type { MemoryByte } from "./byte";

export interface MemoryConfig {
  store: MemoryStore;
  search?: MemorySearchIndex;
  // graph?: MemoryGraphIndex;
  // archive?: MemoryArchiveIndex;
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
 * Input for creating a new memory.
 */
export interface NewMemory {
  id: string;
  scope: MemoryScope;
  collection: string;
  content: MemoryByte;
  wmem?: boolean;
  smemExpiresAt?: number | null;
  timestamp?: number;
  metadata?: JSONObject | null;
}

/**
 * A persisted memory record.
 */
export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  collection: string;
  content: MemoryByte;
  wmem: boolean;
  smemExpiresAt: number | null;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  metadata: JSONObject | null;
}

/**
 * Partial update for a memory record.
 */
export interface MemoryUpdate {
  content?: MemoryByte;
  wmem?: boolean;
  smemExpiresAt?: number | null;
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
 * A search result hit.
 */
export interface MemorySearchHit {
  id: string;
  relevance: number;
  record?: MemoryRecord;
}

/**
 * Params for triggering reindexing of a memory record.
 */
export interface MemoryReindexParams {
  id: string;
  indexes?: ("search" | "graph" | "archive")[];
}
