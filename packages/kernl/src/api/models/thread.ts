import type { LanguageModelItem } from "@kernl-sdk/protocol";
import type { ThreadState } from "@/types/thread";

/**
 * Model metadata for the language model used by a thread.
 *
 * Provides the two components of the composite modelId key: "{provider}/{modelId}"
 */
export interface MThreadModelInfo {
  /**
   * Provider identifier, e.g. `"openai"`, `"anthropic"`, `"vertex"`.
   */
  provider: string;

  /**
   * Concrete model identifier within the provider, e.g. `"gpt-4.1"` or `"claude-3-opus"`.
   */
  modelId: string;
}

/**
 * Thread model returned by Kernl APIs.
 *
 * This represents the persisted state of a thread – what you get back from
 * `kernl.threads.get()` / `kernl.threads.list()`.
 */
export interface MThread {
  /**
   * Globally-unique thread identifier.
   *
   * You can pass this back into agents (via `threadId`) to resume execution
   * or into storage APIs to fetch history.
   */
  tid: string;

  /**
   * Logical namespace this thread belongs to, e.g. `"kernl"` or `"org-a"`.
   *
   * Namespaces let you partition threads by tenant, environment, or product.
   */
  namespace: string;

  /**
   * Optional human-readable title for the thread.
   */
  title?: string | null;

  /**
   * ID of the agent that owns this thread.
   */
  agentId: string;

  /**
   * Language model used for this thread.
   */
  model: MThreadModelInfo;

  /**
   * User-defined context object that was attached to this thread.
   *
   * This is the raw JSON-serializable context, not a `Context` instance.
   */
  context: Record<string, unknown>;

  /**
   * Optional parent task ID that spawned this thread, if any.
   */
  parentTaskId: string | null;

  /**
   * Current lifecycle state of the thread (running, stopped, etc.).
   */
  state: ThreadState;

  /**
   * When the thread record was first created.
   */
  createdAt: Date;

  /**
   * When the thread record was last updated (state, context, etc.).
   */
  updatedAt: Date;

  /**
   * Event history for this thread, when requested via options.
   *
   * Only present when you call APIs like `kernl.threads.get(id, { history: true })`
   * or `kernl.threads.get(id, { history: { ... } })`. For list endpoints,
   * history is omitted to keep responses lightweight.
   */
  history?: MThreadEvent[];
}

/**
 * Common metadata for all thread events.
 *
 * These fields are added on top of the underlying `LanguageModelItem`
 * when events are persisted to storage.
 */
export interface MThreadEventBase {
  /**
   * Globally-unique event identifier within the thread.
   */
  id: string;

  /**
   * ID of the thread this event belongs to.
   */
  tid: string;

  /**
   * Monotonically-increasing sequence number within the thread.
   *
   * `seq` defines the total order of events for a given thread.
   */
  seq: number;

  /**
   * Timestamp when the event was recorded (wall-clock time).
   */
  timestamp: Date;

  /**
   * Arbitrary metadata attached to the event (implementation-specific).
   */
  metadata: Record<string, unknown>;
}

/**
 * Thread event as returned by APIs like `kernl.threads.history()`.
 *
 * This is a `LanguageModelItem` (message, tool-call, tool-result, etc.)
 * enriched with thread-specific metadata such as `tid` and `seq`.
 *
 * Internal system events are filtered out before exposing this type.
 */
export type MThreadEvent = LanguageModelItem & MThreadEventBase;
