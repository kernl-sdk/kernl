/**
 * Storage contracts for Kernl.
 *
 * Core owns these interfaces; storage packages implement them.
 * (must be defined here to avoid circular deps)
 */

export type {
  NewThread,
  ThreadUpdate,
  ThreadFilter,
  ThreadHistoryOptions,
  ThreadInclude,
  SortOrder,
  ThreadListOptions,
  ThreadStore,
} from "./thread";

export type { Transaction, KernlStorage } from "./base";

export { InMemoryStorage, InMemoryThreadStore } from "./in-memory";
