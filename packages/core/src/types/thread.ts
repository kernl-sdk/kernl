import { z } from "zod";

import { Task } from "@/task";
import { Context } from "@/context";
import { LanguageModel } from "@/model";
import { JSONValue } from "@/serde/json";

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
  task?: Task<TContext> /* pid instead perhaps? */;
  model?: LanguageModel;
}

/**
 * Every item in the protocol provides a `providerData` field to accommodate custom functionality
 * or new fields
 */
export const SharedBase = z.object({
  /**
   * Additional optional provider specific data. Used for custom functionality or model provider
   * specific fields.
   */
  providerData: z.record(z.string(), z.any()).optional(),
});

export type SharedBase = z.infer<typeof SharedBase>;

/**
 * Every event has a shared of shared item data including an optional ID.
 */
export const EventBase = SharedBase.extend({
  /**
   * An ID to identify the event. This is optional by default. If a model provider absolutely
   * requires this field, it will be validated on the model level.
   */
  id: z.string().optional(),
});

export type EventBase = z.infer<typeof EventBase>;

// ----------------------------
// Content types
// ----------------------------

export const Refusal = SharedBase.extend({
  type: z.literal("refusal"),
  /**
   * The refusal explanation from the model.
   */
  refusal: z.string(),
});

export type Refusal = z.infer<typeof Refusal>;

/**
 * Defines base properties common to all message or artifact parts.
 */
export const PartBase = SharedBase.extend({
  /**
   * Optional metadata associated with this part.
   */
  metadata: z.record(z.string(), z.any()).optional(),
});

export type PartBase = z.infer<typeof PartBase>;

// [ Message parts - define (ai, A2A) ]

export const TextPart = PartBase.extend({
  kind: z.literal("text"),
  /**
   * A text input for example a message from a user
   */
  text: z.string(),
});

export type TextPart = z.infer<typeof TextPart>;

/**
 * Encompasses all kinds of files - images, audio, etc.
 */
export const FilePart = PartBase.extend({
  kind: z.literal("file"),
  /**
   * The file input to the model. URL or base64 data.
   */
  data: z.string(),
  /**
   * The MIME type of the file.
   */
  mime: z.string(),
  /**
   * Optional filename metadata when uploading file data inline.
   */
  filename: z.string().optional(),
});

export type FilePart = z.infer<typeof FilePart>;

/**
 * Encompasses all kinds of files - images, audio, etc.
 */
export const DataPart = PartBase.extend({
  kind: z.literal("data"),
  /**
   * The structured data content
   */
  data: z.record(z.string(), z.any()),
});

export type DataPart = z.infer<typeof DataPart>;

/**
 * A discriminated union representing a part of a message or artifact, which can
 * be text, a file, or structured data.
 */
export const MessagePart = z.union([TextPart, FilePart, DataPart]);

export type MessagePart = z.infer<typeof MessagePart>;

export const Reasoning = SharedBase.extend({
  id: z.string().optional(),
  kind: z.literal("reasoning"),

  /**
   * The user facing representation of the reasoning. Additional information might be in the `providerData` field.
   */
  content: z.array(TextPart),

  /**
   * The raw reasoning text from the model.
   */
  rawContent: z.array(TextPart).optional(),
});

export type Reasoning = z.infer<typeof Reasoning>;

/**
 * This is a catch all for events that are not part of the protocol.
 *
 * For example, a model might return an event that is not part of the protocol using this type.
 *
 * In that case everything returned from the model should be passed in the `providerData` field.
 *
 * This enables new features to be added to be added by a model provider without breaking the protocol.
 */
export const UnknownEvent = EventBase.extend({
  kind: z.literal("unknown"),
});

export type UnknownEvent = z.infer<typeof UnknownEvent>;

// ----------------------------
// Message types
// ----------------------------

export const MessageBase = SharedBase.extend({
  kind: z.literal("message"),

  id: z.string(),
  /**
   * The content parts of the message.
   */
  content: z.array(MessagePart),
  /**
   * Optional additional metadata for the message
   */
  metadata: z.record(z.string(), z.any()).optional(),
});

export type MessageBase = z.infer<typeof MessageBase>;

export const SystemMessage = MessageBase.extend({
  /**
   * Representing a system message to the user
   */
  role: z.literal("system"),
});

export type SystemMessage = z.infer<typeof SystemMessage>;

export const AssistantMessage = MessageBase.extend({
  /**
   * Representing a message from the assistant
   */
  role: z.literal("assistant"),
});

export const UserMessage = MessageBase.extend({
  /**
   * Representing a message from the user
   */
  role: z.literal("user"),
});

export const Message = z.discriminatedUnion("role", [
  SystemMessage,
  AssistantMessage,
  UserMessage,
]);

export type Message = z.infer<typeof Message>;

// ----------------------------
// Tool call types
// ----------------------------

export const ToolCall = EventBase.extend({
  kind: z.literal("tool-call"),

  /**
   * The ID of the tool call. Required to match up the respective tool call result.
   */
  callId: z.string().describe("The ID of the tool call"),

  /**
   * The unique identifier of the tool
   */
  id: z.string().describe("The id of the function"),

  /**
   * The name of the tool.
   */
  name: z.string().optional().describe("The name of the function"),

  /**
   * The status of the function call. (TODO?)
   */
  status: z.enum(["in_progress", "completed", "incomplete"]).optional(),

  /**
   * The arguments of the function call.
   */
  arguments: z.string(),
});

export type ToolCall = z.infer<typeof ToolCall>;

/**
 * Status of a tool execution
 */
export const ToolStatus = z.enum([
  "in_progress",
  "completed",
  "incomplete",
  "requires_approval",
  "error",
]);

export type ToolStatus = z.infer<typeof ToolStatus>;

export const ToolResultEvent = EventBase.extend({
  kind: z.literal("tool-result"),

  /**
   * The name of the tool that was called
   */
  name: z.string().describe("The name of the tool"),

  /**
   * The ID of the tool call. Required to match up the respective tool call result.
   */
  callId: z.string().describe("The ID of the tool call"),

  /**
   * The status of the tool call.
   */
  status: ToolStatus,

  /**
   * The result of the tool call. Must be JSON-serializable.
   */
  result: JSONValue.optional().describe(
    "Result returned by the tool call. Must be JSON-serializable (null, string, number, boolean, array, or object).",
  ),

  /**
   * Error message if status is "error"
   */
  error: z
    .string()
    .nullable()
    .describe("Error message if the tool call failed"),
});

export type ToolResultEvent = z.infer<typeof ToolResultEvent>;

export const AgentExecutionEvent = z.discriminatedUnion("kind", [
  // --- events ---
  AssistantMessage,
  // --- actions ---
  Reasoning,
  ToolCall,
  ToolResultEvent,
  // ActionApprovalRequest,
  // ActionApprovalResponse,
  // SpawnTask,
  // Delegate,
]);

export type AgentExecutionEvent = z.infer<typeof AgentExecutionEvent>;

export const ThreadEvent = z.union([
  SystemMessage,
  AssistantMessage,
  UserMessage,
  Reasoning,
  ToolCall,
  ToolResultEvent,
  UnknownEvent,
]);

export type ThreadEvent = z.infer<typeof ThreadEvent>;

export const UsageData = z.object({
  requests: z.number().optional(),
  /**
   * The number of input (prompt) tokens used.
   */
  inputTokens: z.number(),
  /**
   * The number of output (completion) tokens used.
   */
  outputTokens: z.number(),
  /**
   * The total number of tokens as reported by the provider.
   * This number might be different from the sum of `inputTokens` and `outputTokens`
   * and e.g. include reasoning tokens or other overhead.
   */
  totalTokens: z.number(),
  /**
The number of reasoning tokens used.
   */
  reasoningTokens: z.number().optional(),

  /**
The number of cached input tokens.
   */
  cachedInputTokens: z.number().optional(),
});

export type UsageData = z.infer<typeof UsageData>;

// ----------------------------
// Stream event types
// ----------------------------

/**
 * Stream event indicating the start of a text output.
 */
export const TextStartEvent = SharedBase.extend({
  kind: z.literal("text-start"),
  /**
   * The ID of the text output.
   */
  id: z.string(),
});

export type TextStartEvent = z.infer<typeof TextStartEvent>;

/**
 * Stream event indicating the end of a text output.
 */
export const TextEndEvent = SharedBase.extend({
  kind: z.literal("text-end"),
  /**
   * The ID of the text output.
   */
  id: z.string(),
});

export type TextEndEvent = z.infer<typeof TextEndEvent>;

/**
 * Stream event containing a delta (chunk) of text output.
 */
export const TextDeltaEvent = SharedBase.extend({
  kind: z.literal("text-delta"),
  /**
   * The ID of the text output.
   */
  id: z.string(),
  /**
   * The incremental text chunk.
   */
  text: z.string(),
});

export type TextDeltaEvent = z.infer<typeof TextDeltaEvent>;

/**
 * Stream event indicating the start of reasoning output.
 */
export const ReasoningStartEvent = SharedBase.extend({
  kind: z.literal("reasoning-start"),
  /**
   * The ID of the reasoning output.
   */
  id: z.string(),
});

export type ReasoningStartEvent = z.infer<typeof ReasoningStartEvent>;

/**
 * Stream event indicating the end of reasoning output.
 */
export const ReasoningEndEvent = SharedBase.extend({
  kind: z.literal("reasoning-end"),
  /**
   * The ID of the reasoning output.
   */
  id: z.string(),
});

export type ReasoningEndEvent = z.infer<typeof ReasoningEndEvent>;

/**
 * Stream event containing a delta (chunk) of reasoning output.
 */
export const ReasoningDeltaEvent = SharedBase.extend({
  kind: z.literal("reasoning-delta"),
  /**
   * The ID of the reasoning output.
   */
  id: z.string(),
  /**
   * The incremental reasoning text chunk.
   */
  text: z.string(),
});

export type ReasoningDeltaEvent = z.infer<typeof ReasoningDeltaEvent>;

/**
 * Stream event indicating the start of tool input generation.
 */
export const ToolInputStartEvent = SharedBase.extend({
  kind: z.literal("tool-input-start"),
  /**
   * The ID of the tool call.
   */
  id: z.string(),
  /**
   * The name of the tool being called.
   */
  toolName: z.string(),
  /**
   * Whether the tool was executed by the provider.
   */
  providerExecuted: z.boolean().optional(),
  /**
   * Whether this is a dynamic tool call.
   */
  dynamic: z.boolean().optional(),
  /**
   * Optional title for the tool call.
   */
  title: z.string().optional(),
});

export type ToolInputStartEvent = z.infer<typeof ToolInputStartEvent>;

/**
 * Stream event indicating the end of tool input generation.
 */
export const ToolInputEndEvent = SharedBase.extend({
  kind: z.literal("tool-input-end"),
  /**
   * The ID of the tool call.
   */
  id: z.string(),
});

export type ToolInputEndEvent = z.infer<typeof ToolInputEndEvent>;

/**
 * Stream event containing a delta (chunk) of tool input.
 */
export const ToolInputDeltaEvent = SharedBase.extend({
  kind: z.literal("tool-input-delta"),
  /**
   * The ID of the tool call.
   */
  id: z.string(),
  /**
   * The incremental tool input chunk.
   */
  delta: z.string(),
});

export type ToolInputDeltaEvent = z.infer<typeof ToolInputDeltaEvent>;

/**
 * Stream event containing a complete tool call.
 */
export const ToolCallEvent = ToolCall;

export type ToolCallEvent = z.infer<typeof ToolCallEvent>;

/**
 * Stream event indicating the start of agent execution.
 */
export const StartEvent = SharedBase.extend({
  kind: z.literal("start"),
});

export type StartEvent = z.infer<typeof StartEvent>;

/**
 * Reason why a language model finished generating a response.
 */
export const FinishReason = z.enum([
  "stop" /* model generated stop sequence */,
  "length" /* model generated maximum number of tokens */,
  "content-filter" /* content filter violation stopped the model */,
  "tool-calls" /* model triggered tool calls */,
  "error" /* model stopped because of an error */,
  "other" /* model stopped for other reasons */,
  "unknown" /* the model has not transmitted a finish reason */,
]);

export type FinishReason = z.infer<typeof FinishReason>;

/**
 * Stream event indicating the completion of agent execution.
 */
export const FinishEvent = SharedBase.extend({
  kind: z.literal("finish"),
  /**
   * The reason for completion.
   */
  finishReason: FinishReason,
  /**
   * Total usage data for the execution.
   */
  usage: UsageData,
});

export type FinishEvent = z.infer<typeof FinishEvent>;

/**
 * Stream event indicating the agent execution was aborted.
 */
export const AbortEvent = SharedBase.extend({
  kind: z.literal("abort"),
});

export type AbortEvent = z.infer<typeof AbortEvent>;

/**
 * Stream event indicating an error occurred during execution.
 */
export const ErrorEvent = SharedBase.extend({
  kind: z.literal("error"),
  /**
   * The error that occurred.
   */
  error: z.unknown(),
});

export type ErrorEvent = z.infer<typeof ErrorEvent>;

/**
 * Stream event containing raw provider-specific data.
 */
export const RawEvent = SharedBase.extend({
  kind: z.literal("raw"),
  /**
   * The raw value from the provider.
   */
  rawValue: z.unknown(),
});

export type RawEvent = z.infer<typeof RawEvent>;

/**
 * Discriminated union of all possible stream events during agent execution.
 */
export const ThreadStreamEvent = z.discriminatedUnion("kind", [
  TextStartEvent,
  TextEndEvent,
  TextDeltaEvent,
  ReasoningStartEvent,
  ReasoningEndEvent,
  ReasoningDeltaEvent,
  ToolInputStartEvent,
  ToolInputEndEvent,
  ToolInputDeltaEvent,
  ToolCallEvent,
  ToolResultEvent,
  StartEvent,
  FinishEvent,
  AbortEvent,
  ErrorEvent,
  RawEvent,
]);

export type ThreadStreamEvent = z.infer<typeof ThreadStreamEvent>;

export type TextResponse = "text";
