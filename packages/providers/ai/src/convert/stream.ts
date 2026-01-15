import type { Codec } from "@kernl-sdk/shared/lib";
import {
  type LanguageModelStreamEvent,
  COMPLETED,
  FAILED,
  IN_PROGRESS,
} from "@kernl-sdk/protocol";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

import { WARNING } from "./response";

/**
 * Convert AI SDK stream to async iterable of kernl stream events.
 */
export async function* convertStream(
  stream: ReadableStream<LanguageModelV3StreamPart>,
): AsyncIterable<LanguageModelStreamEvent> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const event = STREAM_PART.decode(value);
      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Codec for converting individual stream parts.
 */
export const STREAM_PART: Codec<
  LanguageModelStreamEvent | null,
  LanguageModelV3StreamPart
> = {
  encode: () => {
    throw new Error("codec:unimplemented");
  },

  decode: (
    part: LanguageModelV3StreamPart,
  ): LanguageModelStreamEvent | null => {
    switch (part.type) {
      case "text-start":
        return {
          kind: "text.start",
          id: part.id,
          providerMetadata: part.providerMetadata,
        };

      case "text-delta":
        return {
          kind: "text.delta",
          id: part.id,
          text: part.delta,
          providerMetadata: part.providerMetadata,
        };

      case "text-end":
        return {
          kind: "text.end",
          id: part.id,
          providerMetadata: part.providerMetadata,
        };

      case "reasoning-start":
        return {
          kind: "reasoning.start",
          id: part.id,
          providerMetadata: part.providerMetadata,
        };

      case "reasoning-delta":
        return {
          kind: "reasoning.delta",
          id: part.id,
          text: part.delta,
          providerMetadata: part.providerMetadata,
        };

      case "reasoning-end":
        return {
          kind: "reasoning.end",
          id: part.id,
          providerMetadata: part.providerMetadata,
        };

      case "tool-input-start":
        return {
          kind: "tool.input.start",
          id: part.id,
          toolId: part.toolName,
          title: part.title,
          providerMetadata: part.providerMetadata,
        };

      case "tool-input-delta":
        return {
          kind: "tool.input.delta",
          id: part.id,
          delta: part.delta,
          providerMetadata: part.providerMetadata,
        };

      case "tool-input-end":
        return {
          kind: "tool.input.end",
          id: part.id,
          providerMetadata: part.providerMetadata,
        };

      case "tool-call":
        return {
          kind: "tool.call",
          callId: part.toolCallId,
          toolId: part.toolName,
          state: IN_PROGRESS,
          arguments: part.input || "{}",
          providerMetadata: part.providerMetadata,
        };

      case "tool-result":
        // provider-defined tools can stream tool results
        return {
          kind: "tool.result",
          callId: part.toolCallId,
          toolId: part.toolName,
          state: part.isError ? FAILED : COMPLETED,
          result: part.isError ? null : part.result,
          error: part.isError ? String(part.result) : null,
          providerMetadata: part.providerMetadata,
        };

      case "stream-start":
        return {
          kind: "stream.start",
          warnings: part.warnings.map(WARNING.decode),
        };

      case "finish":
        return {
          kind: "finish",
          finishReason: part.finishReason as any, // Types should match
          usage: part.usage,
          providerMetadata: part.providerMetadata,
        };

      case "error":
        return {
          kind: "error",
          error:
            part.error instanceof Error
              ? part.error
              : new Error(String(part.error)),
        };

      case "raw":
        return {
          kind: "raw",
          rawValue: part.rawValue,
        };

      // - unknown or no equivalent -
      case "response-metadata":
      case "file":
      case "source":
        return {
          kind: "raw",
          rawValue: part,
        };

      default:
        return null;
    }
  },
};
