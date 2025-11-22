import type { Thread } from "@/thread";
import type { ThreadStore, ThreadInclude, ThreadListOptions } from "@/storage";
import type { ThreadEvent } from "@/types/thread";

/**
 * Parameters for listing threads.
 */
export interface ThreadsListParams {
  /**
   * Maximum number of threads to return.
   */
  limit?: number;

  /**
   * Return threads created before this cursor.
   */
  before?: string;

  /**
   * Return threads created after this cursor.
   */
  after?: string;

  /**
   * Filter by agent ID.
   */
  agentId?: string;
}

/**
 * Threads resource - provides a clean API for managing threads.
 */
export class ThreadsResource {
  constructor(private store: ThreadStore) {}

  /**
   * Get a thread by ID.
   *
   * @param id - Thread ID
   * @param options - Optional include options (defaults to including history)
   * @returns Thread instance with history, or null if not found
   *
   * @example
   * ```ts
   * const thread = await kernl.threads.get("thread_123");
   * if (thread) {
   *   console.log(thread.history); // Array of ThreadEvents
   * }
   * ```
   */
  async get(id: string, options?: ThreadInclude): Promise<Thread | null> {
    const include = options ?? { history: true }; // include history by default
    return this.store.get(id, include);
  }

  /**
   * List threads with optional filtering and pagination.
   *
   * @param params - List parameters
   * @returns Array of threads
   *
   * @example
   * ```ts
   * // List recent threads for a specific agent
   * const threads = await kernl.threads.list({
   *   agentId: "jarvis",
   *   limit: 20
   * });
   * ```
   */
  async list(params: ThreadsListParams = {}): Promise<Thread[]> {
    const options: ThreadListOptions = {
      limit: params.limit,
      filter: params.agentId ? { agentId: params.agentId } : undefined,
      order: { createdAt: "desc" },
    };

    // TODO: Implement cursor-based pagination with before/after
    // For now, just pass through to storage
    return this.store.list(options);
  }

  /**
   * Delete a thread and all its events.
   *
   * @param id - Thread ID
   *
   * @example
   * ```ts
   * await kernl.threads.delete("thread_123");
   * ```
   */
  async delete(id: string): Promise<void> {
    return this.store.delete(id);
  }

  /**
   * Get the event history for a thread.
   *
   * @param id - Thread ID
   * @returns Array of thread events
   *
   * @example
   * ```ts
   * const events = await kernl.threads.history("thread_123");
   * console.log(events.length); // Number of events in thread
   * ```
   */
  async history(id: string): Promise<ThreadEvent[]> {
    return this.store.history(id);
  }
}
