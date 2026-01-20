import type {
  LanguageModelItem,
  LanguageModelTool,
  LanguageModelUsage,
  LanguageModelFinishReason,
  LanguageModelResponseItem,
  LanguageModelRequestSettings,
  LanguageModelResponseType,
  SharedWarning,
  ToolCallState,
} from "@kernl-sdk/protocol";

import { ThreadState } from "@/internal";

// -----------------------------------------------------------------------------
// Span Data
// -----------------------------------------------------------------------------

export type SpanId = string;

export interface ThreadSpan {
  kind: "thread";
  threadId: string;
  agentId: string;
  namespace: string;
  context?: unknown;
  state?: ThreadState;
  result?: unknown;
  error?: string;
}

export interface ModelCallSpan {
  kind: "model.call";
  provider: string;
  modelId: string;
  request?: {
    input: LanguageModelItem[];
    settings?: LanguageModelRequestSettings;
    responseType?: LanguageModelResponseType;
    tools?: LanguageModelTool[];
  };
  response?: {
    content: LanguageModelResponseItem[];
    finishReason: LanguageModelFinishReason;
    usage?: LanguageModelUsage;
    warnings?: SharedWarning[];
  };
}

export interface ToolCallSpan {
  kind: "tool.call";
  toolId: string;
  callId: string;
  args?: Record<string, unknown>;
  state?: ToolCallState;
  result?: string;
  error?: string | null;
}

export type SpanData = ThreadSpan | ModelCallSpan | ToolCallSpan;
export type SpanKind = SpanData["kind"];

// -----------------------------------------------------------------------------
// Event Data
// -----------------------------------------------------------------------------

export interface ThreadErrorEvent {
  kind: "thread.error";
  message: string;
  stack?: string;
}

export interface ThreadAbortedEvent {
  kind: "thread.aborted";
  reason?: string;
}

export interface ThreadGuardrailTriggeredEvent {
  kind: "thread.guardrail_triggered";
  name: string;
  type: "input" | "output";
  passed: boolean;
  reason?: string;
}

export interface ToolApprovalRequestedEvent {
  kind: "tool.approval_requested";
  toolId: string;
  callId: string;
}

export interface ToolApprovalGrantedEvent {
  kind: "tool.approval_granted";
  toolId: string;
  callId: string;
  approver?: string;
}

export interface ToolApprovalDeniedEvent {
  kind: "tool.approval_denied";
  toolId: string;
  callId: string;
  reason?: string;
}

export type EventData =
  | ThreadErrorEvent
  | ThreadAbortedEvent
  | ThreadGuardrailTriggeredEvent
  | ToolApprovalRequestedEvent
  | ToolApprovalGrantedEvent
  | ToolApprovalDeniedEvent;

export type EventKind = EventData["kind"];

