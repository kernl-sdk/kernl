import {
  ToolCall,
  LanguageModel,
  LanguageModelItem,
  LanguageModelStreamEvent,
} from "@kernl/protocol";

import { Task } from "@/task";
import { Context } from "@/context";

/**
 * Thread-specific tool call state for approval workflow.
 * This extends the protocol states for internal thread use.
 */
export const REQUIRES_APPROVAL = "requires_approval";

/**
 * ThreadEvent uses protocol types directly.
 *
 * (TODO): just an alias for LanguageModelItem for now, but there may be other thread events later
 * which don't go to the model.
 */
export type ThreadEvent = LanguageModelItem;

/**
 * Stream events - use protocol definition directly.
 */
export type ThreadStreamEvent = LanguageModelStreamEvent;

/**
 * Set of actionable items extracted from a model response
 */
export interface ActionSet {
  toolCalls: ToolCall[];
  // Future: other actions, mcpRequests, etc.
}

/**
 * Result of a single tick of execution
 */
export interface TickResult {
  /**
   * Events to add to thread history
   */
  events: ThreadEvent[];
  /**
   * Action intentions that need to be performed as a result of this tick
   */
  intentions: ActionSet | null;
}

/**
 * Result of performing actions, including both executed results and pending approvals
 */
export interface PerformActionsResult {
  /**
   * Action events generated from executing tools (tool results)
   */
  actions: ThreadEvent[];
  /**
   * Tool calls that require approval before execution
   */
  pendingApprovals: ToolCall[];
}

/**
 * Result of thread execution
 */
export interface ThreadExecuteResult<TResponse = any> {
  /**
   * The final parsed response from the agent
   */
  response: TResponse;
  /**
   * The thread state at completion
   */
  state: any; // Will be ThreadState, but avoiding circular dependency
}

export interface ThreadOptions<TContext> {
  context: Context<TContext>;
  task?: Task<TContext>;
  model?: LanguageModel;
}

export type TextResponse = "text";
