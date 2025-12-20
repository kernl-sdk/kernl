import type { Codec } from "@kernl-sdk/shared/lib";
import { randomID } from "@kernl-sdk/shared/lib";
import type {
  RealtimeClientEvent,
  RealtimeServerEvent,
  RealtimeSessionConfig,
  TurnDetectionConfig,
  LanguageModelItem,
} from "@kernl-sdk/protocol";

import type {
  OpenAIClientEvent,
  OpenAIServerEvent,
  OpenAISessionConfig,
  OpenAITurnDetection,
  OpenAIItem,
  OpenAIContentPart,
} from "./types";

/**
 * Codec for turn detection config.
 */
export const TURN_DETECTION: Codec<TurnDetectionConfig, OpenAITurnDetection> = {
  /**
   * Convert kernl turn detection to OpenAI format.
   */
  encode(config) {
    return {
      type: config.mode === "manual" ? "none" : config.mode,
      threshold: config.threshold,
      silence_duration_ms: config.silenceDurationMs,
      prefix_padding_ms: config.prefixPaddingMs,
      create_response: config.createResponse,
      interrupt_response: config.interruptResponse,
    };
  },

  /**
   * Convert OpenAI turn detection to kernl format.
   */
  decode(config) {
    return {
      mode: config.type === "none" ? "manual" : config.type,
      threshold: config.threshold,
      silenceDurationMs: config.silence_duration_ms,
      prefixPaddingMs: config.prefix_padding_ms,
      createResponse: config.create_response,
      interruptResponse: config.interrupt_response,
    };
  },
};

/**
 * Codec for session config.
 */
export const SESSION_CONFIG: Codec<RealtimeSessionConfig, OpenAISessionConfig> =
  {
    /**
     * Convert kernl session config to OpenAI format.
     */
    encode(config) {
      return {
        instructions: config.instructions,
        modalities: config.modalities,
        voice: config.voice?.voiceId,
        input_audio_format: config.audio?.inputFormat?.mimeType,
        output_audio_format: config.audio?.outputFormat?.mimeType,
        turn_detection: config.turnDetection
          ? TURN_DETECTION.encode(config.turnDetection)
          : undefined,
        tools: config.tools
          ?.filter((t) => t.kind === "function")
          .map((t) => ({
            type: "function" as const,
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
      };
    },

    /**
     * Convert OpenAI session config to kernl format.
     */
    decode(config) {
      return {
        instructions: config.instructions,
        modalities: config.modalities,
        voice: config.voice ? { voiceId: config.voice } : undefined,
        turnDetection: config.turn_detection
          ? TURN_DETECTION.decode(config.turn_detection)
          : undefined,
      };
    },
  };

/**
 * Codec for conversation items.
 */
export const ITEM: Codec<LanguageModelItem, OpenAIItem> = {
  /**
   * Convert kernl item to OpenAI format.
   */
  encode(item) {
    switch (item.kind) {
      case "message": {
        const content: OpenAIContentPart[] = item.content.map((c) => {
          switch (c.kind) {
            case "text":
              return item.role === "assistant"
                ? { type: "output_text", text: c.text }
                : { type: "input_text", text: c.text };
            case "file":
              // audio files get sent as input_audio
              if (
                c.mimeType.startsWith("audio/") &&
                "data" in c &&
                typeof c.data === "string"
              ) {
                return { type: "input_audio", audio: c.data };
              }
              return { type: "input_text", text: "" };
            default:
              return { type: "input_text", text: "" };
          }
        });
        return { type: "message", role: item.role, content };
      }

      case "tool-call":
        return {
          type: "function_call",
          call_id: item.callId,
          name: item.toolId,
          arguments: item.arguments,
        };

      case "tool-result":
        return {
          type: "function_call_output",
          call_id: item.callId,
          output: item.error ?? JSON.stringify(item.result) ?? "",
        };

      default:
        throw new Error(
          `Unsupported item kind: ${(item as LanguageModelItem).kind}`,
        );
    }
  },

  /**
   * Convert OpenAI item to kernl format.
   */
  decode(item) {
    switch (item.type) {
      case "message":
        return {
          kind: "message",
          id: randomID(),
          role: item.role,
          content: item.content.map((c) => ({
            kind: "text" as const,
            text: "text" in c ? c.text : "",
          })),
        };

      case "function_call":
        return {
          kind: "tool-call",
          callId: item.call_id,
          toolId: item.name,
          state: "completed" as const,
          arguments: item.arguments,
        };

      case "function_call_output":
        return {
          kind: "tool-result",
          callId: item.call_id,
          toolId: "",
          state: "completed" as const,
          result: item.output,
          error: null,
        };

      default:
        throw new Error(
          `Unsupported OpenAI item type: ${(item as OpenAIItem).type}`,
        );
    }
  },
};

/**
 * Codec for client events (kernl → OpenAI).
 */
export const CLIENT_EVENT: Codec<
  RealtimeClientEvent,
  OpenAIClientEvent | null
> = {
  /**
   * Convert kernl client event to OpenAI wire format.
   */
  encode(event) {
    switch (event.kind) {
      case "session.update":
        return {
          type: "session.update",
          session: SESSION_CONFIG.encode(event.config),
        };

      case "audio.input.append":
        return { type: "input_audio_buffer.append", audio: event.audio };

      case "audio.input.commit":
        return { type: "input_audio_buffer.commit" };

      case "audio.input.clear":
        return { type: "input_audio_buffer.clear" };

      case "item.create":
        return {
          type: "conversation.item.create",
          item: ITEM.encode(event.item),
          previous_item_id: event.previousItemId,
        };

      case "item.delete":
        return { type: "conversation.item.delete", item_id: event.itemId };

      case "item.truncate":
        return {
          type: "conversation.item.truncate",
          item_id: event.itemId,
          content_index: 0,
          audio_end_ms: event.audioEndMs,
        };

      case "response.create":
        return {
          type: "response.create",
          response: event.config
            ? {
                instructions: event.config.instructions,
                modalities: event.config.modalities,
              }
            : undefined,
        };

      case "response.cancel":
        return { type: "response.cancel", response_id: event.responseId };

      case "tool.result":
        return {
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.callId,
            output: event.error ?? event.result ?? "",
          },
        };

      case "activity.start":
      case "activity.end":
        return null;

      default:
        return null;
    }
  },

  /**
   * Not implemented - use SERVER_EVENT.decode instead.
   */
  decode() {
    throw new Error("CLIENT_EVENT.decode: use SERVER_EVENT instead");
  },
};

/**
 * Codec for server events (OpenAI → kernl).
 */
export const SERVER_EVENT: Codec<
  RealtimeServerEvent | null,
  OpenAIServerEvent
> = {
  /**
   * Not implemented - use CLIENT_EVENT.encode instead.
   */
  encode() {
    throw new Error("SERVER_EVENT.encode: use CLIENT_EVENT instead");
  },

  /**
   * Convert OpenAI server event to kernl format.
   */
  decode(event) {
    switch (event.type) {
      case "session.created":
        return {
          kind: "session.created",
          session: {
            id: event.session.id,
            config: SESSION_CONFIG.decode(event.session),
          },
        };

      case "session.updated":
        return {
          kind: "session.updated",
          session: {
            id: event.session.id,
            config: SESSION_CONFIG.decode(event.session),
          },
        };

      case "error":
        return {
          kind: "session.error",
          error: { code: event.error.code, message: event.error.message },
        };

      case "input_audio_buffer.committed":
        return { kind: "audio.input.committed", itemId: event.item_id };

      case "input_audio_buffer.cleared":
        return { kind: "audio.input.cleared" };

      case "input_audio_buffer.speech_started":
        return {
          kind: "speech.started",
          audioStartMs: event.audio_start_ms,
          itemId: event.item_id,
        };

      case "input_audio_buffer.speech_stopped":
        return {
          kind: "speech.stopped",
          audioEndMs: event.audio_end_ms,
          itemId: event.item_id,
        };

      case "conversation.item.created":
        return {
          kind: "item.created",
          item: ITEM.decode(event.item),
          previousItemId: event.previous_item_id,
        };

      case "conversation.item.done":
        return null;

      case "conversation.item.deleted":
        return { kind: "item.deleted", itemId: event.item_id };

      case "conversation.item.truncated":
        return {
          kind: "item.truncated",
          itemId: event.item_id,
          audioEndMs: event.audio_end_ms,
        };

      case "response.created":
        return { kind: "response.created", responseId: event.response.id };

      case "response.done": {
        const status =
          event.response.status === "incomplete" ||
          event.response.status === "in_progress"
            ? "failed"
            : event.response.status;
        return {
          kind: "response.done",
          responseId: event.response.id,
          status,
          usage: event.response.usage
            ? {
                inputTokens: event.response.usage.input_tokens,
                outputTokens: event.response.usage.output_tokens,
                totalTokens: event.response.usage.total_tokens,
              }
            : undefined,
        };
      }

      case "response.output_audio.delta":
        return {
          kind: "audio.output.delta",
          responseId: event.response_id,
          itemId: event.item_id,
          audio: event.delta,
        };

      case "response.output_audio.done":
        return {
          kind: "audio.output.done",
          responseId: event.response_id,
          itemId: event.item_id,
        };

      case "response.text.delta":
        return {
          kind: "text.output.delta",
          responseId: event.response_id,
          itemId: event.item_id,
          delta: event.delta,
        };

      case "response.text.done":
        return {
          kind: "text.output",
          responseId: event.response_id,
          itemId: event.item_id,
          text: event.text,
        };

      case "conversation.item.input_audio_transcription.delta":
        return {
          kind: "transcript.input.delta",
          itemId: event.item_id,
          delta: event.delta,
        };

      case "conversation.item.input_audio_transcription.completed":
        return {
          kind: "transcript.input",
          itemId: event.item_id,
          text: event.transcript,
        };

      case "response.output_audio_transcript.delta":
        return {
          kind: "transcript.output.delta",
          responseId: event.response_id,
          itemId: event.item_id,
          delta: event.delta,
        };

      case "response.output_audio_transcript.done":
        return {
          kind: "transcript.output",
          responseId: event.response_id,
          itemId: event.item_id,
          text: event.transcript,
        };

      case "response.output_item.added":
        if (event.item.type === "function_call") {
          return {
            kind: "tool.start",
            responseId: event.response_id,
            callId: event.item.call_id,
            toolId: event.item.name,
          };
        }
        return null;

      case "response.output_item.done":
        return null;

      case "response.function_call_arguments.delta":
        return {
          kind: "tool.delta",
          callId: event.call_id,
          delta: event.delta,
        };

      case "response.function_call_arguments.done":
        return {
          kind: "tool.call",
          callId: event.call_id,
          toolId: event.name,
          arguments: event.arguments,
        };

      default:
        return null;
    }
  },
};
