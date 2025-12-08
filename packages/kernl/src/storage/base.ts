/**
 * Core storage contracts.
 * /packages/kernl/src/storage/base.ts
 */

import type { AgentRegistry, ModelRegistry } from "@/kernl/types";
import type { ThreadStore } from "./thread";
import type { MemoryStore } from "@/memory"
// import type { MemoryStore } from "@/memory/store"
import type { WakeupStore } from "@/wakeup";

/**
 * The main storage interface for Kernl.
 *
 * Provides access to system stores (threads, tasks, traces) and transaction support.
 */
export interface KernlStorage {
  /**
   * Thread store - manages thread execution records and event history.
   */
  threads: ThreadStore;

  /**
   * Memory store - manages memory records for agents.
   */
  memories: MemoryStore;

  /**
   * Wakeup store - manages wakeup records for agents.
   */
  wakeups: WakeupStore

  // tasks: TaskStore;
  // traces: TraceStore;

  /**
   * Bind runtime registries to storage.
   *
   * Called by Kernl after construction to wire up agent/model lookups.
   */
  bind(registries: { agents: AgentRegistry; models: ModelRegistry }): void;

  /**
   * Execute a function within a transaction.
   *
   * All operations performed using the transaction-scoped stores will be
   * committed atomically or rolled back on error.
   */
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;

  /**
   * Initialize the storage backend.
   *
   * Connects to the database and ensures all required schemas/tables exist.
   */
  init(): Promise<void>;

  /**
   * Close the storage backend and cleanup resources.
   */
  close(): Promise<void>;

  /**
   * Runs the migrations in order to ensure all required tables exist.
   */
  migrate(): Promise<void>;
}

/**
 * Transaction context providing transactional access to stores.
 */
export interface Transaction {
  /**
   * Thread store within this transaction.
   */
  threads: ThreadStore;

  // Future stores (deferred)
  // tasks: TaskStore;
  // traces: TraceStore;

  /**
   * Commit the transaction.
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction.
   */
  rollback(): Promise<void>;
}
