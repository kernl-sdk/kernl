import { ZodType } from "zod";

import type { ResolvedAgentResponse } from "@/guardrail";

/* lib */
import { json } from "@/lib/serde/codec";
import { ModelBehaviorError } from "@/lib/error";

/* types */
import type { AgentResponseType } from "@/types/agent";
import type { ThreadEvent } from "@/types/thread";

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
  // Text output - return as-is
  if (responseType === "text") {
    return text as ResolvedAgentResponse<TResponse>;
  }

  // Structured output - decode JSON and validate with schema
  if (responseType && typeof responseType === "object") {
    const schema = responseType as ZodType;
    const codec = json(schema);

    try {
      const validated = codec.decode(text); // (TODO): it would be nice if we could use `decodeSafe` here
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
