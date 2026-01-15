import type { Codec } from "@kernl-sdk/shared/lib";
import {
  IN_PROGRESS,
  COMPLETED,
  FAILED,
  type LanguageModelResponse,
  type LanguageModelResponseItem,
  type LanguageModelResponseType,
  type LanguageModelFinishReason,
  type LanguageModelUsage,
  type SharedWarning,
  type SharedProviderMetadata,
} from "@kernl-sdk/protocol";
import { randomID } from "@kernl-sdk/shared/lib";
import type {
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3Usage,
  SharedV3Warning,
  JSONSchema7,
} from "@ai-sdk/provider";

/**
 * AI SDK generate result structure
 */
export interface AISdkGenerateResult {
  content: Array<LanguageModelV3Content>;
  finishReason: LanguageModelV3FinishReason;
  usage: LanguageModelV3Usage;
  providerMetadata?: Record<string, unknown>;
  warnings: Array<SharedV3Warning>;
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
              kind: "tool.call",
              callId: item.toolCallId,
              toolId: item.toolName,
              state: IN_PROGRESS,
              arguments: item.input || "{}",
              providerMetadata: item.providerMetadata,
            });
            break;

          case "tool-result":
            content.push({
              kind: "tool.result",
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

export const WARNING: Codec<SharedWarning, SharedV3Warning> = {
  encode: () => {
    throw new Error("codec:unimplemented");
  },
  decode: (warning) => warning as SharedWarning,
};

/**
 * AI SDK response format type.
 *
 * Maps to the `responseFormat` parameter in AI SDK's doGenerate/doStream.
 */
export interface AISdkResponseFormat {
  type: "json";
  schema?: JSONSchema7;
  name?: string;
  description?: string;
}

/**
 * Codec for converting protocol responseType to AI SDK responseFormat.
 *
 * - `kind: "text"` or undefined → undefined (AI SDK defaults to text)
 * - `kind: "json"` → `{ type: "json", schema, name, description }`
 */
export const RESPONSE_FORMAT: Codec<
  LanguageModelResponseType | undefined,
  AISdkResponseFormat | undefined
> = {
  encode: (responseType) => {
    if (!responseType || responseType.kind === "text") {
      return undefined;
    }

    return {
      type: "json",
      schema: responseType.schema,
      name: responseType.name,
      description: responseType.description,
    };
  },
  decode: () => {
    throw new Error("codec:unimplemented");
  },
};
