import type { Codec } from "@kernl-sdk/shared/lib";
import { randomID } from "@kernl-sdk/shared/lib";
import type {
  RealtimeClientEvent,
  RealtimeServerEvent,
  RealtimeSessionConfig,
  TurnDetectionConfig,
  LanguageModelItem,
  AudioConfig,
} from "@kernl-sdk/protocol";

import type {
  GrokClientEvent,
  GrokServerEvent,
  GrokSessionConfig,
  GrokTurnDetection,
  GrokItem,
  GrokContentPart,
  GrokAudioConfig,
  GrokTool,
  GrokVoice,
} from "../protocol";

/**
 * Map kernl voice ID to Grok voice name.
 * Falls back to "Ara" (default) if not a valid Grok voice.
 */
function toGrokVoice(voiceId: string | undefined): GrokVoice | undefined {
  if (!voiceId) return undefined;
  const validVoices: GrokVoice[] = ["Ara", "Rex", "Sal", "Eve", "Leo"];
  return validVoices.includes(voiceId as GrokVoice)
    ? (voiceId as GrokVoice)
    : "Ara";
}

/**
 * Codec for turn detection config.
 */
export const TURN_DETECTION: Codec<
  TurnDetectionConfig,
  GrokTurnDetection | null
> = {
  encode(config) {
    return {
      type: config.mode === "manual" ? null : "server_vad",
    };
  },

  decode(config) {
    return {
      mode: config?.type === "server_vad" ? "server_vad" : "manual",
    };
  },
};

/**
 * Codec for audio config.
 */
export const AUDIO_CONFIG: Codec<AudioConfig, GrokAudioConfig> = {
  encode(config) {
    const result: GrokAudioConfig = {};

    if (config.inputFormat) {
      result.input = {
        format: {
          type: (config.inputFormat.mimeType as "audio/pcm") || "audio/pcm",
          rate: config.inputFormat.sampleRate,
        },
      };
    }

    if (config.outputFormat) {
      result.output = {
        format: {
          type: (config.outputFormat.mimeType as "audio/pcm") || "audio/pcm",
          rate: config.outputFormat.sampleRate,
        },
      };
    }

    return result;
  },

  decode(config) {
    return {
      inputFormat: config.input?.format
        ? {
            mimeType: config.input.format.type,
            sampleRate: config.input.format.rate,
          }
        : undefined,
      outputFormat: config.output?.format
        ? {
            mimeType: config.output.format.type,
            sampleRate: config.output.format.rate,
          }
        : undefined,
    };
  },
};

/**
 * Codec for session config.
 */
export const SESSION_CONFIG: Codec<RealtimeSessionConfig, GrokSessionConfig> = {
  encode(config) {
    const tools: GrokTool[] | undefined = config.tools
      ?.filter((t) => t.kind === "function")
      .map((t) => ({
        type: "function" as const,
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

    return {
      instructions: config.instructions,
      voice: toGrokVoice(config.voice?.voiceId),
      turn_detection: config.turnDetection
        ? TURN_DETECTION.encode(config.turnDetection)
        : undefined,
      audio: config.audio ? AUDIO_CONFIG.encode(config.audio) : undefined,
      tools: tools?.length ? tools : undefined,
    };
  },

  decode(config) {
    return {
      instructions: config.instructions,
      voice: config.voice ? { voiceId: config.voice } : undefined,
      turnDetection: config.turn_detection
        ? TURN_DETECTION.decode(config.turn_detection)
        : undefined,
      audio: config.audio ? AUDIO_CONFIG.decode(config.audio) : undefined,
    };
  },
};

/**
 * Codec for conversation items.
 */
export const ITEM: Codec<LanguageModelItem, GrokItem> = {
  encode(item) {
    switch (item.kind) {
      case "message": {
        const content: GrokContentPart[] = item.content.map((c) => {
          switch (c.kind) {
            case "text":
              return { type: "input_text", text: c.text };
            default:
              return { type: "input_text", text: "" };
          }
        });
        return {
          type: "message",
          role: item.role as "user" | "assistant",
          content,
        };
      }

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
          `Unsupported Grok item type: ${(item as GrokItem).type}`,
        );
    }
  },
};

/**
 * Codec for client events (kernl → Grok).
 */
export const CLIENT_EVENT: Codec<RealtimeClientEvent, GrokClientEvent | null> =
  {
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

        case "response.create":
          return { type: "response.create" };

        case "tool.result":
          return {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: event.callId,
              output: event.error ?? event.result ?? "",
            },
          };

        // Unsupported by Grok
        case "item.delete":
        case "item.truncate":
        case "response.cancel":
        case "activity.start":
        case "activity.end":
          return null;

        default:
          return null;
      }
    },

    decode() {
      throw new Error("CLIENT_EVENT.decode: use SERVER_EVENT instead");
    },
  };

/**
 * Codec for server events (Grok → kernl).
 */
export const SERVER_EVENT: Codec<RealtimeServerEvent | null, GrokServerEvent> =
  {
    encode() {
      throw new Error("SERVER_EVENT.encode: use CLIENT_EVENT instead");
    },

    decode(event) {
      switch (event.type) {
        case "conversation.created":
          // Grok sends conversation.created instead of session.created
          return {
            kind: "session.created",
            session: {
              id: event.conversation.id,
              config: {},
            },
          };

        case "session.updated":
          return {
            kind: "session.updated",
            session: {
              id: event.event_id,
              config: SESSION_CONFIG.decode(event.session),
            },
          };

        case "input_audio_buffer.committed":
          return { kind: "audio.input.committed", itemId: event.item_id };

        case "input_audio_buffer.cleared":
          return { kind: "audio.input.cleared" };

        case "input_audio_buffer.speech_started":
          return {
            kind: "speech.started",
            audioStartMs: 0, // Grok doesn't provide this
            itemId: event.item_id,
          };

        case "input_audio_buffer.speech_stopped":
          return {
            kind: "speech.stopped",
            audioEndMs: 0, // Grok doesn't provide this
            itemId: event.item_id,
          };

        case "conversation.item.added":
          return {
            kind: "item.created",
            item: ITEM.decode(event.item),
            previousItemId: event.previous_item_id,
          };

        case "conversation.item.input_audio_transcription.completed":
          return {
            kind: "transcript.input",
            itemId: event.item_id,
            text: event.transcript,
          };

        case "response.created":
          return { kind: "response.created", responseId: event.response.id };

        case "response.output_item.added":
          // Could emit tool.start here for function calls
          return null;

        case "response.done":
          return {
            kind: "response.done",
            responseId: event.response.id,
            status: event.response.status === "completed" ? "completed" : "failed",
            usage: undefined,
          };

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
            text: "", // Grok doesn't include final text in done event
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
