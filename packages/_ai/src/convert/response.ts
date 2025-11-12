import type {
  Codec,
  LanguageModelResponse,
  LanguageModelResponseItem,
  LanguageModelFinishReason,
  LanguageModelUsage,
  LanguageModelWarning,
  SharedProviderMetadata,
} from "@kernl/protocol";
import { randomID } from "@kernl/shared/lib";
import type {
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3Usage,
  LanguageModelV3CallWarning,
} from "@ai-sdk/provider";

/**
 * AI SDK generate result structure
 */
export interface AISdkGenerateResult {
  content: Array<LanguageModelV3Content>;
  finishReason: LanguageModelV3FinishReason;
  usage: LanguageModelV3Usage;
  providerMetadata?: Record<string, unknown>;
  warnings: Array<LanguageModelV3CallWarning>;
}

export const MODEL_RESPONSE: Codec<LanguageModelResponse, AISdkGenerateResult> =
  {
    encode: () => {
      throw new Error("codec:unimplemented");
    },

    decode: (result: AISdkGenerateResult) => {
      const content: LanguageModelResponseItem[] = [];

      for (const item of result.content) {
        if (item.type === "text") {
          content.push({
            kind: "message",
            role: "assistant",
            id: randomID(),
            content: [
              {
                kind: "text",
                text: item.text,
                providerMetadata: item.providerMetadata,
              },
            ],
            providerMetadata: item.providerMetadata,
          });
        } else if (item.type === "reasoning") {
          content.push({
            kind: "reasoning",
            text: item.text,
            providerMetadata: item.providerMetadata,
          });
        } else if (item.type === "tool-call") {
          content.push({
            kind: "tool-call",
            callId: item.toolCallId,
            toolId: item.toolName,
            state: "completed",
            arguments: JSON.stringify(item.input),
            providerMetadata: item.providerMetadata,
          });
        } else if (item.type === "file") {
          content.push({
            kind: "message",
            role: "assistant",
            id: randomID(),
            content: [
              {
                kind: "file",
                mimeType: item.mediaType,
                data: item.data,
              },
            ],
          });
        }
        // TODO: Handle other content types (source, tool-result)
      }

      const finishReason = FINISH_REASON.decode(result.finishReason);
      const usage = USAGE.decode(result.usage);
      const warnings = result.warnings.map(WARNING.decode);

      return {
        content,
        finishReason,
        usage,
        warnings,
        providerMetadata: result.providerMetadata as
          | SharedProviderMetadata
          | undefined,
      };
    },
  };

const FINISH_REASON: Codec<
  LanguageModelFinishReason,
  LanguageModelV3FinishReason
> = {
  encode: () => {
    throw new Error("codec:unimplemented");
  },
  decode: (reason) => reason as LanguageModelFinishReason,
};

const USAGE: Codec<LanguageModelUsage, LanguageModelV3Usage> = {
  encode: () => {
    throw new Error("codec:unimplemented");
  },
  decode: (usage) => usage as LanguageModelUsage,
};

export const WARNING: Codec<LanguageModelWarning, LanguageModelV3CallWarning> =
  {
    encode: () => {
      throw new Error("codec:unimplemented");
    },

    decode: (warning: LanguageModelV3CallWarning) => {
      switch (warning.type) {
        case "unsupported-setting":
          return {
            type: "unsupported-setting",
            setting: warning.setting as any,
            details: warning.details,
          };
        case "other":
          return {
            type: "other",
            message: warning.message,
          };
        default:
          return {
            type: "other",
            message: "Unknown warning type",
          };
      }
    },
  };
