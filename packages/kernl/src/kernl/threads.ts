import type { Thread } from "@/thread";
import type { ThreadStore, ThreadListOptions } from "@/storage";
import type { ThreadEvent, ThreadResource } from "@/types/thread";

/**
 * Threads resource - provides a clean API for managing threads.
 *
 * Returns public ThreadResource types, not internal Thread class instances.
 */
export class ThreadsResource {
  constructor(private store: ThreadStore) {}

  /**
   * Get a thread by ID.
   *
   * @param id - Thread ID
   * @param options - Include options (history included by default)
   * @returns Thread resource, or null if not found
   *
   * @example
   * ```ts
   * // With history (default)
   * const thread = await kernl.threads.get("thread_123");
   * console.log(thread?.history); // Array of ThreadEvents
   *
   * // Without history
   * const thread = await kernl.threads.get("thread_123", { includeHistory: false });
   * ```
   */
  async get(
    id: string,
    options?: ThreadGetOptions,
  ): Promise<ThreadResource | null> {
    const includeHistory = options?.includeHistory ?? true; // include history by default
    const thread = await this.store.get(id, { history: includeHistory });

    if (!thread) {
      return null;
    }

    const history = includeHistory ? await this.store.history(id) : undefined;
    return ThreadResourceCodec.decode(thread, history);
  }

  /**
   * List threads with optional filtering and pagination.
   *
   * Returns thread metadata only (no event history).
   * Use get() with includeHistory to retrieve full thread details.
   *
   * @param params - List parameters
   * @returns Array of thread resources (metadata only)
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
  async list(params: ThreadsListParams = {}): Promise<ThreadResource[]> {
    const options: ThreadListOptions = {
      limit: params.limit,
      filter: params.agentId ? { agentId: params.agentId } : undefined,
      order: { createdAt: "desc" },
    };

    // TODO: Implement cursor-based pagination with before/after
    const threads = await this.store.list(options);
    return threads.map((t) => ThreadResourceCodec.decode(t));
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
 * Options for getting a thread.
 */
export interface ThreadGetOptions {
  /**
   * Include full event history in the response.
   * @default true
   */
  includeHistory?: boolean;
}

/**
 * Codec: Convert internal Thread instance to public ThreadResource.
 */
const ThreadResourceCodec = {
  decode(thread: Thread, history?: ThreadEvent[]): ThreadResource {
    const resource: ThreadResource = {
      tid: thread.tid,
      agentId: thread.agent.id,
      model: {
        provider: thread.model.provider,
        modelId: thread.model.modelId,
      },
      context: thread.context.context as Record<string, unknown>,
      parentTaskId: thread.parent?.id ?? null,
      state: thread.state,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };

    if (history !== undefined) {
      resource.history = history;
    }

    return resource;
  },
};
