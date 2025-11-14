import { ZodType } from "zod";

import type { ResolvedAgentResponse } from "@/guardrail";

/* lib */
import { json } from "@kernl-sdk/shared/lib";
import { ToolCall } from "@kernl-sdk/protocol";
import { ModelBehaviorError } from "@/lib/error";

/* types */
import type { AgentResponseType } from "@/types/agent";
import type { ThreadEvent, ThreadStreamEvent, ActionSet } from "@/types/thread";

/**
 * Check if an event represents an intention (action to be performed)
 */
export function isActionIntention(event: ThreadEvent): event is ToolCall {
  return event.kind === "tool-call";
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
export function notDelta(event: ThreadStreamEvent): event is ThreadEvent {
  switch (event.kind) {
    case "message":
    case "reasoning":
    case "tool-call":
    case "tool-result":
      return true;

    // all other events are streaming deltas/control events
    default:
      return false;
  }
}

/**
 * Extract the final text response from a list of events.
 * Returns null if no assistant message with text content is found.
 */
export function getFinalResponse(events: ThreadEvent[]): string | null {
  // Scan backwards for the last assistant message
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.kind === "message" && event.role === "assistant") {
      // Extract text from content parts
      for (const part of event.content) {
        if (part.kind === "text") {
          return part.text;
        }
      }
    }
  }
  return null;
}

/**
 * (TODO): This should run through the language model's native structured output (if avail)
 *
 * Parse the final response according to the response type schema.
 * - If responseType is "text", returns the text as-is
 * - If responseType is a ZodType, parses and validates the text as JSON
 *
 * @throws {ModelBehaviorError} if structured output validation fails
 */
export function parseFinalResponse<TResponse extends AgentResponseType>(
  text: string,
  responseType: TResponse,
): ResolvedAgentResponse<TResponse> {
  if (responseType === "text") {
    return text as ResolvedAgentResponse<TResponse>; // text output - return as-is
  }

  // structured output - decode JSON and validate with schema
  if (responseType && typeof responseType === "object") {
    // (TODO): prob better way of checking this here
    const schema = responseType as ZodType;

    try {
      const validated = json(schema).decode(text); // (TODO): it would be nice if we could use `decodeSafe` here
      return validated as ResolvedAgentResponse<TResponse>;
    } catch (error) {
      throw new ModelBehaviorError(
        `Failed to parse structured output: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Fallback - should not reach here
  return text as ResolvedAgentResponse<TResponse>;
}
