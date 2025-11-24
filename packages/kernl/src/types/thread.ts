import {
  ToolCall,
  LanguageModel,
  LanguageModelItem,
  LanguageModelStreamEvent,
  RUNNING,
  STOPPED,
  INTERRUPTIBLE,
  UNINTERRUPTIBLE,
  ZOMBIE,
  DEAD,
} from "@kernl-sdk/protocol";

import { Task } from "@/task";
import { Context } from "@/context";
import { Agent } from "@/agent";

import type { AgentResponseType } from "./agent";
import type { ThreadStore } from "@/storage";

/**
 * Public/client-facing thread events (excludes internal system events).
 */
export type PublicThreadEvent = LanguageModelItem & ThreadEventBase;

export type TextResponse = "text";

/**
 * Thread state values as a const array (for zod schemas).
 */
export const THREAD_STATES = [
  RUNNING,
  STOPPED,
  INTERRUPTIBLE,
  UNINTERRUPTIBLE,
  ZOMBIE,
  DEAD,
] as const;

/**
 * Thread state discriminated union
 */
export type ThreadState =
  | typeof RUNNING
  | typeof STOPPED
  | typeof INTERRUPTIBLE
  | typeof UNINTERRUPTIBLE
  | typeof ZOMBIE
  | typeof DEAD;

/**
 * Thread-specific tool call state for approval workflow.
 * This extends the protocol states for internal thread use.
 */
export const REQUIRES_APPROVAL = "requires_approval";

/**
 * Thread domain interface.
 *
 * Represents the complete state of a Thread that can be stored and restored.
 */
export interface IThread<
  TContext = unknown,
  TResponse extends AgentResponseType = "text",
> {
  tid: string;
  agent: Agent<TContext, TResponse>;
  model: LanguageModel;

  context: Context<TContext>;
  input: LanguageModelItem[] /* initial input for the thread */;
  history: ThreadEvent[];
  task: Task<TContext> | null /* parent task which spawned this thread (if any) */;

  /* state */
  tick: number;
  state: ThreadState /* running | stopped | ... */;
  namespace: string;

  /* metadata */
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown> | null;
}

export interface CheckpointDelta {
  state?: ThreadState;
  tick?: number;
  seq?: number;
  events?: ThreadEvent[];
}

/**
 * The inner data of a ThreadEvent without the headers
 */
export type ThreadEventInner = LanguageModelItem; // ...

/**
 * Base fields for all thread events - added to every LanguageModelItem when stored in thread.
 */
export interface ThreadEventBase {
  id: string;
  tid: string;
  seq: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * System event - runtime state changes (not sent to model).
 */
export interface ThreadSystemEvent extends ThreadEventBase {
  readonly kind: "system";
  // Future: error?, state-change?, etc.
}

/**
 * Thread events are append-only log entries ordered by seq.
 *
 * Events extend LanguageModelItem types with thread-specific metadata (tid, seq, timestamp).
 * When sent to the model, we extract the LanguageModelItem by omitting the base fields.
 */
export type ThreadEvent =
  | (LanguageModelItem & ThreadEventBase)
  | ThreadSystemEvent;

/**
 * Stream events - use protocol definition directly.
 */
export type ThreadStreamEvent = LanguageModelStreamEvent;

/**
 * Result of thread execution
 */
export interface ThreadExecuteResult<TResponse = unknown> {
  /**
   * The final parsed response from the agent
   */
  response: TResponse;
  /**
   * The thread state at completion
   */
  state: any; // (TODO): Update this
}

/**
 * Options for constructing a Thread.
 */
export interface ThreadOptions<
  TContext = unknown,
  TResponse extends AgentResponseType = "text",
> {
  agent: Agent<TContext, TResponse>;
  input?: LanguageModelItem[];
  history?: ThreadEvent[];
  context?: Context<TContext>;
  model?: LanguageModel;
  task?: Task<TContext> | null;
  namespace?: string;
  tid?: string;
  tick?: number;
  state?: ThreadState;
  storage?: ThreadStore;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown> | null;
  /**
   * Internal flag indicating whether this thread already has a persisted
   * row in storage. Storage implementations MUST set this to true when
   * hydrating from a store. Callers creating new threads should omit it.
   */
  persisted?: boolean;
}

/**
 * Options passed to agent.execute() and agent.stream().
 */
export interface ThreadExecuteOptions<TContext> {
  context?: Context<TContext>;
  model?: LanguageModel;
  task?: Task<TContext>;
  threadId?: string;
  namespace?: string;
  maxTicks?: number;
  abort?: AbortSignal;
}

/**
 * Set of actionable items extracted from a model response
 */
export interface ActionSet {
  toolCalls: ToolCall[];
  // Future: other actions, mcpRequests, etc.
}

/**
 * Result of performing actions, including both executed results and pending approvals
 */
export interface PerformActionsResult {
  /**
   * Action events generated from executing tools (tool results)
   */
  actions: ThreadEventInner[];
  /**
   * Tool calls that require approval before execution
   */
  pendingApprovals: ToolCall[];
}
