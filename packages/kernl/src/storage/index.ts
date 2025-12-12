/**
 * Storage contracts for Kernl.
 * /packages/kernl/src/storage/index.ts
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
