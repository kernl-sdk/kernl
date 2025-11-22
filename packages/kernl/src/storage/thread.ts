/**
 * Thread storage contracts.
 */

import type { Thread } from "@/thread";
import type { Context } from "@/context";
import type { ThreadEvent, ThreadState } from "@/types/thread";

/* ---- Store ---- */

/**
 * Thread persistence store.
 */
export interface ThreadStore {
  /**
   * Get a thread by id.
   *
   * Optionally include the thread_events.
   */
  get(tid: string, include?: ThreadInclude): Promise<Thread | null>;

  /**
   * List threads matching the filter.
   */
  list(options?: ThreadListOptions): Promise<Thread[]>;

  /**
   * Insert a new thread into the store.
   */
  insert(thread: NewThread): Promise<Thread>;

  /**
   * Update thread runtime state (tick, state, metadata).
   *
   * Does NOT mutate the event log, which is append-only.
   */
  update(tid: string, patch: ThreadUpdate): Promise<Thread>;

  /**
   * Delete a thread and cascade to thread_events.
   */
  delete(tid: string): Promise<void>;

  /**
   * Get the event history for a thread.
   */
  history(tid: string, options?: ThreadHistoryOptions): Promise<ThreadEvent[]>;

  /**
   * Append events to the thread history.
   *
   * Semantics:
   * - Guaranteed per-thread ordering via a monotonically increasing `seq`.
   * - Idempotent on `(tid, event.id)`: duplicate ids MUST NOT create duplicate rows.
   * - Events maintain insertion order.
   *
   * Note:
   * - Thread class manages monotonic seq and timestamp assignment.
   */
  append(events: ThreadEvent[]): Promise<void>;
}

/* ---- DTOs ---- */

/**
 * Input for creating a new thread.
 */
export interface NewThread {
  id: string;
  agentId: string;
  model: string; // composite key: '{provider}/{modelId}'
  context?: unknown; // becomes a Context instance in a Thread
  tick?: number;
  state?: ThreadState;
  parentTaskId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Partial update for thread runtime state.
 *
 * Only mutable fields are exposed (tick, state, context, metadata).
 */
export interface ThreadUpdate {
  tick?: number;
  state?: ThreadState;
  context?: Context;
  metadata?: Record<string, unknown> | null;
}

/**
 * Filter for listing threads.
 */
export interface ThreadFilter {
  state?: ThreadState | ThreadState[];
  agentId?: string;
  parentTaskId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Options for querying thread history.
 */
export interface ThreadHistoryOptions {
  after?: number; // seq number
  limit?: number;
  order?: "asc" | "desc";
  kinds?: string[]; // filter by event kind
}

/**
 * Include options for eager loading related data.
 */
export interface ThreadInclude {
  history?: boolean | ThreadHistoryOptions;
}

/**
 * Sort order direction.
 */
export type SortOrder = "asc" | "desc";

/**
 * Options for listing threads.
 */
export interface ThreadListOptions {
  filter?: ThreadFilter;
  include?: ThreadInclude;
  order?: {
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };
  limit?: number;
  offset?: number;
  cursor?: string;
}
