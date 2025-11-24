import type { ThreadState } from "@/types/thread";
import type { SortOrder } from "@/storage";
import type { CursorPageParams } from "@/api/pagination/cursor";

export interface RThreadHistoryParams {
  /**
   * Only return events with seq greater than this value.
   */
  after?: number;

  /**
   * Maximum number of events to return.
   */
  limit?: number;

  /**
   * Sort order by sequence number.
   *
   * Defaults to `"desc"` so callers see the latest events first.
   */
  order?: "asc" | "desc";

  /**
   * Restrict history to specific event kinds, e.g. `["message", "tool-result"]`.
   */
  kinds?: string[];
}

export interface RThreadsListParams extends CursorPageParams {
  namespace?: string;
  agentId?: string;
  state?: ThreadState | ThreadState[];
  parentTaskId?: string;

  /**
   * Only include threads created after this timestamp.
   */
  after?: Date;

  /**
   * Only include threads created before this timestamp.
   */
  before?: Date;

  order?: {
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };
}

export interface RThreadGetOptions {
  /**
   * Include the thread's event history on the returned model.
   *
   * - `true` will fetch history with default options (latest-first).
   * - An object lets you override history options (limit, kinds, order, etc.).
   *
   * This is equivalent to calling `kernl.threads.history(tid, opts)` and
   * attaching the result to `thread.history`.
   */
  history?: true | RThreadHistoryParams;
}

/**
 * Parameters for creating a new thread via the public Threads resource.
 *
 * Note: low-level API requires explicit agent + model. For most callers,
 * prefer the agent-scoped helpers (agent.threads.create) which infer these.
 */
export interface RThreadCreateParams {
  /**
   * Owning agent id for the new thread.
   */
  agentId: string;

  /**
   * Optional explicit thread id.
   *
   * If omitted, a new id will be generated.
   */
  tid?: string;

  /**
   * Logical namespace to create the thread in.
   *
   * Defaults to `"kernl"` when not provided.
   */
  namespace?: string;

  /**
   * Optional human-readable title for the thread.
   */
  title?: string;

  /**
   * Initial context object for the thread.
   */
  context?: Record<string, unknown>;

  /**
   * Optional parent task id that spawned this thread, if any.
   */
  parentTaskId?: string | null;
  /**
   * Language model backing this thread.
   */
  model: {
    provider: string;
    modelId: string;
  };

  /**
   * Arbitrary JSON-serializable metadata to attach to the thread.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Patch for updating caller-owned thread fields.
 *
 * Semantics for all fields:
 * - `undefined` → leave the field unchanged
 * - value (`object` / `string` / etc.) → replace the field
 * - `null` → clear the field (for `title`, clears `metadata.title`)
 */
export interface RThreadUpdateParams {
  /**
   * Thread context object.
   */
  context?: Record<string, unknown> | null;

  /**
   * Arbitrary metadata bag attached to the thread.
   */
  metadata?: Record<string, unknown> | null;

  /**
   * Human-readable title (stored in `metadata.title`).
   */
  title?: string | null;
}


