import { LanguageModel } from "@kernl-sdk/protocol";

import { Agent } from "@/agent";
import { KernlStorage } from "@/storage";

/**
 * Storage configuration for Kernl.
 */
export interface StorageOptions {
  /**
   * Relational database storage (threads, tasks, traces).
   */
  db?: KernlStorage;

  // Future storage layers (deferred):
  // vector?: VectorStore;
  // blob?: BlobStore;
  // lake?: DataLake;
}

/**
 * Configuration options for creating a Kernl instance.
 */
export interface KernlOptions {
  /**
   * Storage configuration for persisting threads, tasks, and traces.
   */
  storage?: StorageOptions;
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
