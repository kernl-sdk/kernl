import { Emitter } from "@kernl-sdk/shared";

import type {
  LanguageModelUsage,
  LanguageModelFinishReason,
  LanguageModelRequestSettings,
  ToolCallState,
} from "@kernl-sdk/protocol";
import type { Context } from "@/context";
import type { ThreadState } from "@/thread/types";

// --- Thread Events ---

/**
 * Emitted when a thread starts execution.
 */
export interface ThreadStartEvent<TContext = unknown> {
  readonly kind: "thread.start";

  /**
   * The thread ID.
   */
  threadId: string;

  /**
   * The agent executing this thread.
   */
  agentId: string;

  /**
   * The namespace of the thread.
   */
  namespace: string;

  /**
   * The context for this execution.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context: Context<TContext>;
}

/**
 * Emitted when a thread stops execution.
 */
export interface ThreadStopEvent<TContext = unknown, TOutput = unknown> {
  readonly kind: "thread.stop";

  /**
   * The thread ID.
   */
  threadId: string;

  /**
   * The agent that executed this thread.
   */
  agentId: string;

  /**
   * The namespace of the thread.
   */
  namespace: string;

  /**
   * The context for this execution.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context: Context<TContext>;

  /**
   * Final state of the thread.
   */
  state: ThreadState;

  /**
   * The result of execution (present on success).
   */
  result?: TOutput;

  /**
   * Error message (present on error).
   */
  error?: string;
}

// --- Model Events ---

/**
 * Emitted when a model call starts.
 */
export interface ModelCallStartEvent<TContext = unknown> {
  readonly kind: "model.call.start";

  /**
   * The model provider.
   */
  provider: string;

  /**
   * The model ID.
   */
  modelId: string;

  /**
   * Request settings passed to the model.
   */
  settings: LanguageModelRequestSettings;

  /**
   * Thread ID if called within a thread context.
   */
  threadId?: string;

  /**
   * Agent ID if called within an agent context.
   */
  agentId?: string;

  /**
   * Execution context if available.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context?: Context<TContext>;
}

/**
 * Emitted when a model call ends.
 */
export interface ModelCallEndEvent<TContext = unknown> {
  readonly kind: "model.call.end";

  /**
   * The model provider.
   */
  provider: string;

  /**
   * The model ID.
   */
  modelId: string;

  /**
   * Reason the model stopped generating.
   */
  finishReason: LanguageModelFinishReason;

  /**
   * Token usage for this call.
   */
  usage?: LanguageModelUsage;

  /**
   * Thread ID if called within a thread context.
   */
  threadId?: string;

  /**
   * Agent ID if called within an agent context.
   */
  agentId?: string;

  /**
   * Execution context if available.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context?: Context<TContext>;
}

// --- Tool Events ---

/**
 * Emitted when a tool call starts.
 */
export interface ToolCallStartEvent<TContext = unknown> {
  readonly kind: "tool.call.start";

  /**
   * The thread ID.
   */
  threadId: string;

  /**
   * The agent executing this tool.
   */
  agentId: string;

  /**
   * The context for this execution.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context: Context<TContext>;

  /**
   * The tool being called.
   */
  toolId: string;

  /**
   * Unique identifier for this call.
   */
  callId: string;

  /**
   * Arguments passed to the tool (parsed JSON).
   */
  args: Record<string, unknown>;
}

/**
 * Emitted when a tool call ends.
 */
export interface ToolCallEndEvent<TContext = unknown> {
  readonly kind: "tool.call.end";

  /**
   * The thread ID.
   */
  threadId: string;

  /**
   * The agent that executed this tool.
   */
  agentId: string;

  /**
   * The context for this execution.
   *
   * NOTE: Includes `context.agent` reference for tools - may be optimized in future.
   */
  context: Context<TContext>;

  /**
   * The tool that was called.
   */
  toolId: string;

  /**
   * Unique identifier for this call.
   */
  callId: string;

  /**
   * Final state of the tool call.
   */
  state: ToolCallState;

  /**
   * Result if state is "completed".
   */
  result?: string;

  /**
   * Error message if state is "failed", null if successful.
   */
  error: string | null;
}

// --- Union ---

export type LifecycleEvent<TContext = unknown, TOutput = unknown> =
  | ThreadStartEvent<TContext>
  | ThreadStopEvent<TContext, TOutput>
  | ModelCallStartEvent<TContext>
  | ModelCallEndEvent<TContext>
  | ToolCallStartEvent<TContext>
  | ToolCallEndEvent<TContext>;

// --- Event Maps ---

/**
 * Event map for agent-level lifecycle hooks (typed).
 */
export type AgentHookEvents<TContext = unknown, TOutput = unknown> = {
  "thread.start": [event: ThreadStartEvent<TContext>];
  "thread.stop": [event: ThreadStopEvent<TContext, TOutput>];
  "model.call.start": [event: ModelCallStartEvent<TContext>];
  "model.call.end": [event: ModelCallEndEvent<TContext>];
  "tool.call.start": [event: ToolCallStartEvent<TContext>];
  "tool.call.end": [event: ToolCallEndEvent<TContext>];
};

/**
 * Event map for Kernl-level lifecycle hooks (untyped).
 */
export type KernlHookEvents = AgentHookEvents<unknown, unknown>;

/**
 * Event emitter for agent-level lifecycle events.
 */
export class AgentHooks<
  TContext = unknown,
  TOutput = unknown,
> extends Emitter<AgentHookEvents<TContext, TOutput>> {}

/**
 * Event emitter for Kernl-level lifecycle events.
 */
export class KernlHooks extends Emitter<KernlHookEvents> {}
