/**
 * Memory interfaces.
 *
 * Minimal contracts for memory providers.
 */

import type { JSONObject } from "@kernl-sdk/protocol";

// -----------------------------------------------------------------------------
// Scope
// -----------------------------------------------------------------------------

/**
 * Memory scope - identifies who/what this memory belongs to.
 */
export interface MemoryScope {
  namespace?: string;
  entityId?: string;
  agentId?: string;
}

// -----------------------------------------------------------------------------
// Content
// -----------------------------------------------------------------------------

/**
 * Text content.
 */
export type TextByte = string;

/**
 * Image content.
 */
export interface ImageByte {
  data: Uint8Array | string;
  mime: string;
  alt?: string;
}

/**
 * Audio content.
 */
export interface AudioByte {
  data: Uint8Array | string;
  mime: string;
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
 */
export interface MemoryByte {
  text?: TextByte;
  image?: ImageByte;
  audio?: AudioByte;
  video?: VideoByte;
  object?: JSONObject;
}

// -----------------------------------------------------------------------------
// Records
// -----------------------------------------------------------------------------

/**
 * Memory kind - episodic (events/experiences) or semantic (facts/knowledge).
 */
export type MemoryKind = "episodic" | "semantic";

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

// -----------------------------------------------------------------------------
// Inputs
// -----------------------------------------------------------------------------

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
 * Update payload for a memory record.
 */
export interface MemoryRecordUpdate {
  scope?: MemoryScope;
  collection?: string;
  content?: MemoryByte;
  wmem?: boolean;
  smem?: { expiresAt: number | null };
  timestamp?: number;
  updatedAt?: number;
  metadata?: JSONObject | null;
}

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

/**
 * Filter for listing/searching memories.
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
 * Result from semantic memory search.
 */
export interface MemorySearchResult {
  record: MemoryRecord;
  score: number;
}

// -----------------------------------------------------------------------------
// Renderable
// -----------------------------------------------------------------------------

/**
 * Supported render formats for memory context.
 */
export type RenderFormat = "md" | "txt" | "yml";

/**
 * Something that can be rendered into a prompt.
 */
export interface Renderable {
  render(fmt?: RenderFormat): string;
  txt(): string;
  md(): string;
  yml(): string;
}

/**
 * Memory context - either raw string or something renderable.
 */
export type MemorySnapshot = string | Renderable;

// -----------------------------------------------------------------------------
// BaseMemorySnapshot
// -----------------------------------------------------------------------------

/**
 * Base class for memory snapshots.
 *
 * Providers can extend this to create typed snapshots
 * that render into prompts.
 */
export abstract class BaseMemorySnapshot<T = unknown> implements Renderable {
  constructor(
    public readonly scope: MemoryScope,
    public readonly records: T[],
  ) {}

  render(format: RenderFormat = "md"): string {
    switch (format) {
      case "txt":
        return this.txt();
      case "md":
        return this.md();
      case "yml":
        return this.yml();
    }
  }

  abstract txt(): string;
  abstract md(): string;
  abstract yml(): string;
}

// -----------------------------------------------------------------------------
// MemoryStore
// -----------------------------------------------------------------------------

/**
 * Raw memory persistence layer.
 *
 * This is what database adapters (pg, libsql) implement.
 */
export interface MemoryStore<
  TRecord = MemoryRecord,
  TCreate = NewMemory,
  TUpdate = MemoryRecordUpdate,
  TListOptions = MemoryListOptions,
> {
  get(id: string): Promise<TRecord | null>;
  list(options?: TListOptions): Promise<TRecord[]>;
  create(input: TCreate): Promise<TRecord>;
  update(id: string, patch: TUpdate): Promise<TRecord>;
  delete(id: string): Promise<void>;
  mdelete(ids: string[]): Promise<void>;
}

// -----------------------------------------------------------------------------
// MemoryProvider
// -----------------------------------------------------------------------------

/**
 * Memory provider interface.
 *
 * Just needs to provide wmem and smem loaders that return
 * renderable snapshots for prompt injection.
 */
export interface MemoryProvider<
  TWorking extends Renderable = Renderable,
  TShort extends Renderable = Renderable,
> {
  /**
   * Working memory loader.
   *
   * Returns context that can be rendered into the system prompt.
   */
  wmem: {
    load(scope: MemoryScope): Promise<TWorking>;
  };

  /**
   * Short-term memory loader.
   *
   * Returns context that can be rendered into the system prompt.
   */
  smem: {
    load(scope: MemoryScope): Promise<TShort>;
  };
}
