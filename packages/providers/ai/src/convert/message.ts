import type { Codec, LanguageModelItem } from "@kernl-sdk/protocol";
import type {
  LanguageModelV3Message,
  LanguageModelV3TextPart,
  LanguageModelV3FilePart,
  LanguageModelV3ReasoningPart,
  LanguageModelV3ToolCallPart,
} from "@ai-sdk/provider";

export const MESSAGE: Codec<LanguageModelItem, LanguageModelV3Message> = {
  encode: (item) => {
    switch (item.kind) {
      case "message": {
        switch (item.role) {
          case "system": {
            const content = item.content
              .filter((part) => part.kind === "text")
              .map((part) => (part.kind === "text" ? part.text : ""))
              .join("\n");

            return {
              role: "system",
              content: content,
              providerOptions: item.providerMetadata,
            };
          }

          case "user": {
            const content: Array<
              LanguageModelV3TextPart | LanguageModelV3FilePart
            > = [];

            for (const part of item.content) {
              if (part.kind === "text") {
                content.push({
                  type: "text",
                  text: part.text,
                  providerOptions: part.providerMetadata,
                });
              } else if (part.kind === "file") {
                const data = part.data ?? (part.uri ? new URL(part.uri) : "");
                content.push({
                  type: "file",
                  filename: part.filename,
                  data,
                  mediaType: part.mimeType,
                  providerOptions: part.providerMetadata,
                });
              }
            }

            return {
              role: "user",
              content,
              providerOptions: item.providerMetadata,
            };
          }

          case "assistant": {
            const content: Array<
              | LanguageModelV3TextPart
              | LanguageModelV3FilePart
              | LanguageModelV3ReasoningPart
              | LanguageModelV3ToolCallPart
            > = [];

            for (const part of item.content) {
              if (part.kind === "text") {
                content.push({
                  type: "text",
                  text: part.text,
                  providerOptions: part.providerMetadata,
                });
              } else if (part.kind === "file") {
                const data = part.data ?? (part.uri ? new URL(part.uri) : "");
                content.push({
                  type: "file",
                  filename: part.filename,
                  data,
                  mediaType: part.mimeType,
                  providerOptions: part.providerMetadata,
                });
              }
            }

            return {
              role: "assistant",
              content,
              providerOptions: item.providerMetadata,
            };
          }
        }
      }

      case "reasoning": {
        return {
          role: "assistant",
          content: [
            {
              type: "reasoning",
              text: "text" in item ? item.text : "",
              providerOptions: item.providerMetadata,
            },
          ],
        };
      }

      case "tool-call": {
        return {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: item.callId,
              toolName: item.toolId,
              input: JSON.parse(item.arguments),
              providerOptions: item.providerMetadata,
            },
          ],
        };
      }

      case "tool-result": {
        return {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: item.callId,
              toolName: item.toolId,
              output: item.error
                ? {
                    type: "error-text",
                    value: item.error, // (TODO): add support for 'error-json'
                  }
                : {
                    type: "json",
                    value: item.result,
                  },
              providerOptions: item.providerMetadata,
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported LanguageModelItem kind`);
    }
  },

  decode: () => {
    throw new Error("MESSAGE.codec:unimplemented");
  },
};
