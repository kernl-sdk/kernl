/**
 * /packages/kernl/src/kernl/types.ts
 */
import { LanguageModel, EmbeddingModel } from "@kernl-sdk/protocol";
import { SearchIndex } from "@kernl-sdk/retrieval";

import { Agent } from "@/agent";
import { KernlStorage } from "@/storage";
import type { WakeupSchedulerOptions } from "@/scheduler/types";

/**
 * Storage configuration for Kernl.
 */
export interface StorageOptions {
  /**
   * Relational database storage (threads, tasks, traces).
   */
  db?: KernlStorage;

  /**
   * Vector search index for semantic memory search.
   * Supports pgvector, Turbopuffer, etc.
   */
  vector?: SearchIndex;

  // Future storage layers (deferred):
  // blob?: BlobStore;
  // lake?: DataLake;
}

/**
 * Memory system configuration.
 */
export interface MemoryOptions {
  /**
   * Embedding model for memory encoding.
   *
   * Can be:
   * - A string like "openai/text-embedding-3-small" (resolved via provider registry)
   * - An EmbeddingModel instance
   *
   * @default "openai/text-embedding-3-small"
   */
  embeddingModel?: string | EmbeddingModel<string>;

  /**
   * Logical index ID used by the search backend.
   * - For pgvector: becomes the table name (with schema from indexProviderOptions)
   * - For Turbopuffer: becomes the namespace
   * @default "kernl_memories_index"
   */
  indexId?: string;

  /**
   * Backend-specific options passed to SearchIndex.createIndex().
   * - For pgvector: { schema?: string } controls schema (default: "kernl")
   * - For Turbopuffer: not used
   */
  indexProviderOptions?: Record<string, unknown>;

  /**
   * Vector dimensions for embeddings.
   * Only needed if embedding model doesn't provide this automatically.
   * @default 1536
   */
  dimensions?: number;

  /**
   * Similarity metric for vector search.
   * @default "cosine"
   */
  similarity?: "cosine" | "euclidean" | "dot_product";
}

/**
 * Configuration options for creating a Kernl instance.
 */
export interface KernlOptions {
  /**
   * Storage configuration for persisting threads, tasks, and traces.
   */
  storage?: StorageOptions;

  /**
   * Memory system configuration.
   */
  memory?: MemoryOptions;

  /**
   * Scheduler configuration for wakeup polling.
   *
   * - If `true`, creates a scheduler with default options (30s interval, batch size 10)
   * - If an object, creates a scheduler with the provided options
   * - If `false` or omitted, no scheduler is created
   *
   * The scheduler polls for due wakeups and resumes sleeping threads.
   * Call `kernl.scheduler.start()` to begin polling.
   */
  scheduler?: boolean | WakeupSchedulerOptions;
}

/**
 * Agent registry interface.
 *
 * Satisfied by Map<string, Agent>.
 */
export interface AgentRegistry {
  get(id: string): Agent<any> | undefined;
}

/**
 * Model registry interface.
 *
 * Satisfied by Map<string, LanguageModel>.
 * Key format: "provider/modelId"
 *
 * TODO: Create an exhaustive model registry in the protocol package
 * with all supported models and their metadata.
 */
export interface ModelRegistry {
  get(key: string): LanguageModel | undefined;
}
