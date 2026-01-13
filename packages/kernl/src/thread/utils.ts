import { ZodType } from "zod";

import type { ResolvedAgentResponse } from "@/guardrail";

/* lib */
import { json, randomID } from "@kernl-sdk/shared/lib";
import {
  ToolCall,
  LanguageModelItem,
  LanguageModelStreamEvent,
} from "@kernl-sdk/protocol";
import { ModelBehaviorError } from "@/lib/error";

/* types */
import type { AgentOutputType } from "@/agent/types";
import type {
  ThreadEvent,
  ThreadEventBase,
  ActionSet,
  PublicThreadEvent,
} from "./types";

/**
 * Create a ThreadEvent from a LanguageModelItem with thread metadata.
 *
 * @example
 * ```ts
 * tevent({
 *   kind: "message",
 *   seq: 0,
 *   tid: "tid_123",
 *   data: message({role: "user", text: "hello"}),
 * })
 * // → {kind: "message", role: "user", content: [...], id: "message:msg_xyz", tid: "tid_123", seq: 0, timestamp: Date}
 * ```
 */
export function tevent(event: {
  seq: number;
  tid: string;
  kind: ThreadEvent["kind"];
  data: LanguageModelItem | null; // null for system events
  id?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}): ThreadEvent {
  const iid = event.data ? event.data.id : undefined;
  const defaultId = iid ? `${event.kind}:${iid}` : randomID();

  return {
    ...(event.data || {}),
    kind: event.kind,
    id: event.id ?? defaultId,
    tid: event.tid,
    seq: event.seq,
    timestamp: event.timestamp ?? new Date(),
    metadata: event.metadata ?? {},
  } as ThreadEvent;
}

/**
 * Check if an event is a tool call
 */
export function isActionIntention(
  event: ThreadEvent,
): event is ToolCall & ThreadEventBase {
  return event.kind === "tool.call";
}

/**
 * Extract action intentions from a list of events.
 * Returns ActionSet if there are any tool calls, null otherwise.
 */
export function getIntentions(events: ThreadEvent[]): ActionSet | null {
  const toolCalls = events.filter(isActionIntention);
  return toolCalls.length > 0 ? { toolCalls } : null;
}

/**
 * Check if an event is NOT a delta/start/end event (i.e., a complete item).
 * Returns true for complete items: Message, Reasoning, ToolCall, ToolResult
 */
export function notDelta(
  event: LanguageModelStreamEvent,
): event is LanguageModelItem {
  switch (event.kind) {
    case "message":
    case "reasoning":
    case "tool.call":
    case "tool.result":
      return true;

    // all other events are streaming deltas/control events
    default:
      return false;
  }
}

/**
 * Check if an event is public/client-facing (not internal).
 * Filters out internal system events that clients don't need.
 */
export function isPublicEvent(event: ThreadEvent): event is PublicThreadEvent {
  switch (event.kind) {
    case "message":
    case "reasoning":
    case "tool.call":
    case "tool.result":
      return true;

    case "system":
      return false;

    default:
      return false;
  }
}

/**
 * Extract the final text response from a list of items.
 * Returns null if no assistant message with text content is found.
 */
export function getFinalResponse(items: ThreadEvent[]): string | null {
  // scan backwards for the last assistant message
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.kind === "message" && item.role === "assistant") {
      for (const part of item.content) {
        if (part.kind === "text") {
          return part.text;
        }
      }
    }
  }
  return null;
}

/**
 * Parse the final response according to the output type schema.
 *
 * This serves as a safety net validation after native structured output from the provider.
 *
 * - If output is "text", returns the text as-is
 * - If output is a ZodType, parses and validates the text as JSON
 *
 * @throws {ModelBehaviorError} if structured output validation fails
 */
export function parseFinalResponse<TOutput extends AgentOutputType>(
  text: string,
  output: TOutput,
): ResolvedAgentResponse<TOutput> {
  if (output === "text") {
    return text as ResolvedAgentResponse<TOutput>; // text output - return as-is
  }

  // structured output - decode JSON and validate with schema
  if (output && typeof output === "object") {
    // (TODO): prob better way of checking this here
    const schema = output as ZodType;

    try {
      const validated = json(schema).decode(text); // (TODO): it would be nice if we could use `decodeSafe` here
      return validated as ResolvedAgentResponse<TOutput>;
    } catch (error) {
      throw new ModelBehaviorError(
        `Failed to parse structured output: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // fallback - should not reach here
  return text as ResolvedAgentResponse<TOutput>;
}
