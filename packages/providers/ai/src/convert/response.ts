import type { Codec } from "@kernl-sdk/shared/lib";
import {
  IN_PROGRESS,
  COMPLETED,
  FAILED,
  type LanguageModelResponse,
  type LanguageModelResponseItem,
  type LanguageModelFinishReason,
  type LanguageModelUsage,
  type LanguageModelWarning,
  type SharedProviderMetadata,
} from "@kernl-sdk/protocol";
import { randomID } from "@kernl-sdk/shared/lib";
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

    decode: (result: AISdkGenerateResult): LanguageModelResponse => {
      const content: LanguageModelResponseItem[] = [];

      for (const item of result.content) {
        switch (item.type) {
          case "text":
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
            break;

          case "reasoning":
            content.push({
              kind: "reasoning",
              text: item.text,
              providerMetadata: item.providerMetadata,
            });
            break;

          case "tool-call":
            content.push({
              kind: "tool-call",
              callId: item.toolCallId,
              toolId: item.toolName,
              state: IN_PROGRESS,
              arguments: item.input || "{}",
              providerMetadata: item.providerMetadata,
            });
            break;

          case "tool-result":
            content.push({
              kind: "tool-result",
              callId: item.toolCallId,
              toolId: item.toolName,
              state: item.isError ? FAILED : COMPLETED,
              result: item.isError ? null : item.result,
              error: item.isError
                ? typeof item.result === "string"
                  ? item.result
                  : JSON.stringify(item.result)
                : null,
              providerMetadata: item.providerMetadata,
            });
            break;

          case "file":
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
            break;

          case "source":
            // Source type is intentionally not handled
            break;
        }
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
