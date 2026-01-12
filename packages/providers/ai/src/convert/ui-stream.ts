import type { Codec } from "@kernl-sdk/shared/lib";
import {
  type LanguageModelStreamEvent,
  FAILED,
} from "@kernl-sdk/protocol";
import { createUIMessageStream, type UIMessageChunk } from "ai";

/**
 * Convert kernl stream to AI SDK UIMessage stream.
 *
 * @example
 * ```typescript
 * import { toUIMessageStream } from '@kernl-sdk/ai';
 * import { createUIMessageStreamResponse } from 'ai';
 *
 * const stream = agent.stream(input);
 * const ui = toUIMessageStream(stream);
 * return createUIMessageStreamResponse({ stream: ui });
 * ```
 */
export function toUIMessageStream(
  stream: AsyncIterable<LanguageModelStreamEvent>,
): ReadableStream<UIMessageChunk> {
  return createUIMessageStream({
    async execute({ writer }) {
      for await (const event of stream) {
        const chunk = STREAM_UI_PART.encode(event);
        if (chunk) {
          writer.write(chunk);
        }
      }
    },
  });
}

/**
 * Convert kernl's LanguageModelStreamEvent to AI SDK's UIMessageChunk format.
 *
 * This enables streaming kernl agent responses to AI SDK's useChat hook.
 *
 * Note: We deliberately omit providerMetadata in the conversion because:
 * 1. It's optional provider-specific metadata not needed for UI rendering
 * 2. There's a type incompatibility between SharedProviderMetadata and SharedV2ProviderMetadata
 * 3. The UI stream is focused on presentation, not provider implementation details
 */
export const STREAM_UI_PART: Codec<
  LanguageModelStreamEvent,
  UIMessageChunk | null
> = {
  encode: (event: LanguageModelStreamEvent): UIMessageChunk | null => {
    switch (event.kind) {
      case "text.start":
        return {
          type: "text-start",
          id: event.id,
        };

      case "text.delta":
        return {
          type: "text-delta",
          id: event.id,
          delta: event.text,
        };

      case "text.end":
        return {
          type: "text-end",
          id: event.id,
        };

      case "reasoning.start":
        return {
          type: "reasoning-start",
          id: event.id,
        };

      case "reasoning.delta":
        return {
          type: "reasoning-delta",
          id: event.id,
          delta: event.text,
        };

      case "reasoning.end":
        return {
          type: "reasoning-end",
          id: event.id,
        };

      case "tool.input.start":
        return {
          type: "tool-input-start",
          toolCallId: event.id,
          toolName: event.toolId,
          ...(event.title != null ? { title: event.title } : {}),
        };

      case "tool.input.delta":
        return {
          type: "tool-input-delta",
          toolCallId: event.id,
          inputTextDelta: event.delta,
        };

      case "tool.call":
        return {
          type: "tool-input-available",
          toolCallId: event.callId,
          toolName: event.toolId,
          input: JSON.parse(event.arguments),
        };

      case "tool.result":
        // Convert tool result to tool-output-available or tool-output-error
        if (event.state === FAILED) {
          return {
            type: "tool-output-error",
            toolCallId: event.callId,
            errorText: event.error ?? "Unknown error",
          };
        }

        return {
          type: "tool-output-available",
          toolCallId: event.callId,
          output: event.result,
        };

      case "stream.start":
        return {
          type: "start",
        };

      case "finish":
        return {
          type: "finish",
        };

      case "error":
        return {
          type: "error",
          errorText: String(event.error),
        };

      case "abort":
        return {
          type: "abort",
        };

      // - message and reasoning items are not stream events -
      case "message":
      case "reasoning":
      // - events without direct UI equivalents -
      case "tool.input.end":
      case "raw":
        return null;

      default:
        const _exhaustive: never = event;
        return null;
    }
  },

  decode: (_chunk: UIMessageChunk | null): LanguageModelStreamEvent => {
    throw new Error("STREAM_UI_PART.decode: Not yet implemented");
  },
};
