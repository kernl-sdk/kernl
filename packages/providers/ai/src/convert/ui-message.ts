import {
  validateUIMessages,
  type UIMessage,
  type UIDataTypes,
  type UITools,
  type ToolUIPart,
  type DynamicToolUIPart,
  type DataUIPart,
} from "ai";

import type { Codec } from "@kernl-sdk/shared/lib";
import {
  type LanguageModelItem,
  type MessagePart,
  type Reasoning,
  type ToolCall,
  type ToolResult,
  type JSONValue,
  IN_PROGRESS,
  COMPLETED,
  FAILED,
} from "@kernl-sdk/protocol";

/**
 * Converter for transforming Vercel AI SDK UIMessage format (used by useChat hook)
 * to kernl's LanguageModelItem format.
 *
 * @example
 * ```typescript
 * import { UIMessageCodec } from '@kernl-sdk/ai';
 *
 * // Validate and convert incoming UI message to kernl format
 * const items = await UIMessageCodec.decode(uiMessage);
 * ```
 */
export const UIMessageCodec: AsyncCodec<LanguageModelItem, UIMessage> = {
  /**
   * Convert from kernl LanguageModelItem to AI SDK UIMessage.
   *
   * NOTE: use historyToUIMessages() instead since the AI SDK groups assistant parts together (must process as a group).
   */
  encode: (item: LanguageModelItem): UIMessage => {
    throw new Error("UIMessageCodec.encode: Unimplemented");
  },

  /**
   * Convert from AI SDK UIMessage to kernl LanguageModelItems.
   *
   * This validates the message structure using AI SDK's built-in validation,
   * then converts it to kernl's internal format.
   *
   * @throws {Error} If validation fails or unsupported message types are encountered
   */
  decode: async <
    METADATA = unknown,
    DATA_PARTS extends UIDataTypes = UIDataTypes,
    TOOLS extends UITools = UITools,
  >(
    message: UIMessage<METADATA, DATA_PARTS, TOOLS>,
  ): Promise<LanguageModelItem[]> => {
    const [m] = await validateUIMessages({ messages: [message] });

    const items: LanguageModelItem[] = [];
    const mparts: MessagePart[] = [];

    for (const part of m.parts) {
      // --- tool parts ---
      if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
        items.push(
          ...TOOL_UI_PART.decode(part as ToolUIPart | DynamicToolUIPart),
        );
        continue;
      }

      // --- data parts ---
      if (part.type.startsWith("data-")) {
        const name = part.type.replace(/^data-/, "");
        const p = part as DataUIPart<UIDataTypes>;
        mparts.push({
          kind: "data",
          data: { [name]: p.data },
        });
        continue;
      }

      switch (part.type) {
        // -- message parts ---
        case "text":
          mparts.push({ ...part, kind: "text" });
          break;

        case "file": {
          const base64 = part.url.match(/^data:[^;]+;base64,(.+)$/);
          if (base64) {
            // :a: - base64 data URL - extract and store as data
            mparts.push({
              kind: "file",
              mimeType: part.mediaType,
              filename: part.filename,
              data: base64[1],
              providerMetadata: part.providerMetadata,
            });
          } else {
            // :b: - non-base64 data URL or regular URL - store as uri
            mparts.push({
              kind: "file",
              mimeType: part.mediaType,
              filename: part.filename,
              uri: part.url,
              providerMetadata: part.providerMetadata,
            });
          }
          break;
        }

        case "reasoning": {
          const r: Reasoning = {
            kind: "reasoning",
            text: part.text,
            providerMetadata: part.providerMetadata,
          };
          items.push(r);
          break;
        }

        // - skip -
        // case "source-*": - just noting for exhaustiveness
        case "step-start":
        default:
          break;
      }
    }

    // add the message with all collected message parts (if any)
    if (mparts.length > 0) {
      items.unshift({
        kind: "message",
        id: m.id,
        role: m.role,
        content: mparts,
        metadata: m.metadata as Record<string, unknown> | undefined,
        providerMetadata: undefined, // Message-level providerMetadata not in UIMessage
      });
    }

    return items;
  },
};

/**
 * Codec for converting AI SDK tool parts to kernl ToolCall/ToolResult items.
 */
const TOOL_UI_PART: Codec<
  (ToolCall | ToolResult)[],
  ToolUIPart | DynamicToolUIPart
> = {
  encode: (
    _items: (ToolCall | ToolResult)[],
  ): ToolUIPart | DynamicToolUIPart => {
    throw new Error("TOOL_PART.encode: Not yet implemented");
  },

  decode: (part: ToolUIPart | DynamicToolUIPart): (ToolCall | ToolResult)[] => {
    const toolId =
      part.type === "dynamic-tool"
        ? part.toolName
        : part.type.replace(/^tool-/, "");
    const callId = part.toolCallId;

    switch (part.state) {
      case "input-available": {
        const call: ToolCall = {
          kind: "tool.call",
          callId,
          toolId,
          state: IN_PROGRESS,
          arguments: JSON.stringify(part.input ?? {}),
          providerMetadata: part.callProviderMetadata,
        };
        return [call];
      }

      case "output-available": {
        const result: ToolResult = {
          kind: "tool.result",
          callId,
          toolId,
          state: COMPLETED,
          result: part.output as JSONValue | null, // AI SDK ensures tool outputs are JSON-serializable
          error: null,
          providerMetadata: part.callProviderMetadata,
        };
        return [result];
      }

      case "output-error": {
        const result: ToolResult = {
          kind: "tool.result",
          callId,
          toolId,
          state: FAILED,
          result: null,
          error: part.errorText,
          providerMetadata: part.callProviderMetadata,
        };
        return [result];
      }

      // TODO AI SDK v6: Add support for approval-requested, approval-responded, output-denied states
      case "input-streaming":
      default:
        return [];
    }
  },
};

/**
 * Async codec for converting between two formats.
 * Similar to Codec but decode is async and returns an array.
 */
type AsyncCodec<From, To> = {
  encode: (item: From) => To;
  decode: <
    METADATA = unknown,
    DATA_PARTS extends UIDataTypes = UIDataTypes,
    TOOLS extends UITools = UITools,
  >(
    message: To extends UIMessage ? UIMessage<METADATA, DATA_PARTS, TOOLS> : To,
  ) => Promise<From[]>;
};

/**
 * Convert thread history events to AI SDK UIMessages for useChat hook.
 *
 * Groups tool calls with their results and attaches them to the preceding
 * assistant message as parts.
 *
 * @example
 * ```ts
 * import { historyToUIMessages } from '@kernl-sdk/ai';
 *
 * const thread = await kernl.threads.get("thread_123");
 * const messages = historyToUIMessages(thread.history);
 * ```
 */
export function historyToUIMessages(items: LanguageModelItem[]): UIMessage[] {
  const messages: UIMessage[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.kind === "message") {
      const parts = [];

      // add message content parts
      for (const part of item.content) {
        switch (part.kind) {
          case "text":
            parts.push({
              type: "text" as const,
              text: part.text,
              ...(part.providerMetadata && {
                providerMetadata: part.providerMetadata as any,
              }),
            });
            break;

          case "file":
            parts.push({
              type: "file" as const,
              url: part.uri || `data:${part.mimeType};base64,${part.data}`,
              mediaType: part.mimeType,
              filename: part.filename,
              ...(part.providerMetadata && {
                providerMetadata: part.providerMetadata as any,
              }),
            });
            break;

          case "data":
            for (const [name, value] of Object.entries(part.data)) {
              parts.push({ type: `data-${name}` as const, data: value });
            }
            break;
        }
      }

      // look ahead for tool calls/results and reasoning that belong to this message
      if (item.role === "assistant") {
        let j = i + 1;
        const toolMap = new Map<
          string,
          {
            call?: Extract<LanguageModelItem, { kind: "tool.call" }>;
            result?: Extract<LanguageModelItem, { kind: "tool.result" }>;
          }
        >();
        const reasoningParts: Extract<
          LanguageModelItem,
          { kind: "reasoning" }
        >[] = [];

        while (j < items.length && items[j].kind !== "message") {
          const next = items[j];

          if (next.kind === "tool.call") {
            const existing = toolMap.get(next.callId) || {};
            toolMap.set(next.callId, { ...existing, call: next });
          } else if (next.kind === "tool.result") {
            const existing = toolMap.get(next.callId) || {};
            toolMap.set(next.callId, { ...existing, result: next });
          } else if (next.kind === "reasoning") {
            reasoningParts.push(next);
          }

          j++;
        }

        // add reasoning parts first
        for (const reasoning of reasoningParts) {
          parts.push({
            type: "reasoning" as const,
            text: reasoning.text,
            ...(reasoning.providerMetadata && {
              providerMetadata: reasoning.providerMetadata as any,
            }),
          });
        }

        // convert tool pairs to UI parts
        for (const [callId, { call, result }] of toolMap.entries()) {
          if (!call) continue; // orphaned result, skip

          const input = JSON.parse(call.arguments);

          if (result) {
            if (result.state === "failed") {
              parts.push({
                type: `tool-${call.toolId}` as const,
                toolCallId: callId,
                toolName: call.toolId,
                input,
                state: "output-error" as const,
                errorText: result.error || "",
                ...(call.providerMetadata && {
                  callProviderMetadata: call.providerMetadata as any,
                }),
              });
            } else {
              parts.push({
                type: `tool-${call.toolId}` as const,
                toolCallId: callId,
                toolName: call.toolId,
                input,
                state: "output-available" as const,
                output: result.result,
                ...(call.providerMetadata && {
                  callProviderMetadata: call.providerMetadata as any,
                }),
              });
            }
          } else {
            parts.push({
              type: `tool-${call.toolId}` as const,
              toolCallId: callId,
              toolName: call.toolId,
              input,
              state: "input-available" as const,
              ...(call.providerMetadata && {
                callProviderMetadata: call.providerMetadata as any,
              }),
            });
          }
        }

        // skip over the tool and reasoning events we just processed
        i = j - 1;
      }

      messages.push({
        id: item.id,
        role: item.role,
        parts,
      });
    } else if (item.kind === "reasoning") {
      // add reasoning as a part of the last assistant message, or create new message
      const lastMessage = messages[messages.length - 1];
      const rpart = {
        type: "reasoning" as const,
        text: item.text,
        ...(item.providerMetadata && {
          providerMetadata: item.providerMetadata as any,
        }),
      };

      if (lastMessage && lastMessage.role === "assistant") {
        lastMessage.parts.push(rpart);
      } else {
        messages.push({
          id: item.id || `reasoning-${i}`,
          role: "assistant",
          parts: [rpart],
        });
      }
    }
  }

  return messages;
}
