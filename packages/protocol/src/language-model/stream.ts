import { SharedProviderMetadata } from "@/provider";

import type {
  LanguageModelFinishReason,
  LanguageModelUsage,
  LanguageModelWarning,
} from "./model";
import type { ToolCallState } from "./item";

/**
 * Union of all possible language model stream events.
 */
export type LanguageModelStreamEvent =
  | TextStartEvent
  | TextEndEvent
  | TextDeltaEvent
  | ReasoningStartEvent
  | ReasoningEndEvent
  | ReasoningDeltaEvent
  | ToolInputStartEvent
  | ToolInputEndEvent
  | ToolInputDeltaEvent
  | ToolCallEvent
  | ToolResultEvent
  | StartEvent
  | FinishEvent
  | AbortEvent
  | ErrorEvent
  | RawEvent;

/**
 * Base interface for all stream events.
 */
export interface StreamEventBase {
  /**
   * The ID associated with this stream event.
   */
  id?: string;

  /**
   * Additional provider-specific metadata for the event.
   */
  providerMetadata?: SharedProviderMetadata;
}

/**
 * Stream event indicating the start of a text output.
 */
export interface TextStartEvent extends StreamEventBase {
  readonly kind: "text-start";
  id: string;
}

/**
 * Stream event indicating the end of a text output.
 */
export interface TextEndEvent extends StreamEventBase {
  readonly kind: "text-end";
  id: string;
}

/**
 * Stream event containing a delta (chunk) of text output.
 */
export interface TextDeltaEvent extends StreamEventBase {
  readonly kind: "text-delta";
  id: string;

  /**
   * The incremental text chunk.
   */
  text: string;
}

/**
 * Stream event indicating the start of reasoning output.
 */
export interface ReasoningStartEvent extends StreamEventBase {
  readonly kind: "reasoning-start";
  id: string;
}

/**
 * Stream event indicating the end of reasoning output.
 */
export interface ReasoningEndEvent extends StreamEventBase {
  readonly kind: "reasoning-end";
  id: string;
}

/**
 * Stream event containing a delta (chunk) of reasoning output.
 */
export interface ReasoningDeltaEvent extends StreamEventBase {
  readonly kind: "reasoning-delta";
  id: string;

  /**
   * The incremental reasoning text chunk.
   */
  text: string;
}

/**
 * Stream event indicating the start of tool input generation.
 */
export interface ToolInputStartEvent extends StreamEventBase {
  readonly kind: "tool-input-start";
  id: string;

  /**
   * The name of the tool being called.
   */
  toolName: string;

  /**
   * Optional title for the tool call.
   */
  title?: string;
}

/**
 * Stream event indicating the end of tool input generation.
 */
export interface ToolInputEndEvent extends StreamEventBase {
  readonly kind: "tool-input-end";
  id: string;
}

/**
 * Stream event containing a delta (chunk) of tool input.
 */
export interface ToolInputDeltaEvent extends StreamEventBase {
  readonly kind: "tool-input-delta";
  id: string;

  /**
   * The incremental tool input chunk.
   */
  delta: string;
}

/**
 * Stream event containing a complete tool call.
 */
export interface ToolCallEvent extends StreamEventBase {
  readonly kind: "tool-call";
  id: string;

  /**
   * The name of the tool being called.
   */
  toolName: string;

  /**
   * The arguments for the tool call as a JSON string.
   */
  arguments: string;
}

/**
 * Stream event containing a tool result from a provider-executed tool.
 */
export interface ToolResultEvent extends StreamEventBase {
  readonly kind: "tool-result";

  /**
   * The ID of the tool call that this result is associated with.
   */
  callId: string;

  /**
   * Name of the tool that generated this result.
   */
  toolId: string;

  /**
   * The state of the tool call.
   */
  state: ToolCallState;

  /**
   * Result of the tool call. This is a JSON-serializable value.
   */
  result: unknown;

  /**
   * Error message if the tool call failed.
   */
  error: string | null;
}

/**
 * Stream event indicating the start of agent execution.
 */
export interface StartEvent extends StreamEventBase {
  readonly kind: "stream-start";

  /**
   * Warnings for the call (e.g., unsupported settings).
   */
  warnings?: LanguageModelWarning[];
}

/**
 * Stream event indicating the completion of agent execution.
 */
export interface FinishEvent extends StreamEventBase {
  readonly kind: "finish";

  /**
   * The reason for completion.
   */
  finishReason: LanguageModelFinishReason;

  /**
   * Total usage data for the execution.
   */
  usage: LanguageModelUsage;
}

/**
 * Stream event indicating the agent execution was aborted.
 */
export interface AbortEvent extends StreamEventBase {
  readonly kind: "abort";
}

/**
 * Stream event indicating an error occurred during execution.
 */
export interface ErrorEvent extends StreamEventBase {
  readonly kind: "error";

  /**
   * The error that occurred.
   */
  error: unknown;
}

/**
 * Stream event containing raw provider-specific data.
 */
export interface RawEvent extends StreamEventBase {
  readonly kind: "raw";

  /**
   * The raw value from the provider.
   */
  rawValue: unknown;
}
