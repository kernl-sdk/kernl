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
import {
  validateUIMessages,
  type UIMessage,
  type UIDataTypes,
  type UITools,
  type ToolUIPart,
  type DynamicToolUIPart,
  type DataUIPart,
} from "ai";

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
   * NOTE: Leaving unimplemented for now. Unlikely to be necessary since UIs are typically streaming.
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
          kind: "tool-call",
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
          kind: "tool-result",
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
          kind: "tool-result",
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
