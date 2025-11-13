import type { Codec, LanguageModelRequestSettings } from "@kernl/protocol";
import type {
  LanguageModelV3ToolChoice,
  SharedV3ProviderOptions,
} from "@ai-sdk/provider";

import { TOOL_CHOICE } from "./tools";

/**
 * Partial AI SDK call options extracted from settings.
 */
export interface AISdkCallOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  toolChoice?: LanguageModelV3ToolChoice;
  providerOptions?: SharedV3ProviderOptions;
}

export const MODEL_SETTINGS: Codec<
  LanguageModelRequestSettings,
  AISdkCallOptions
> = {
  encode: (settings: LanguageModelRequestSettings) => {
    const options: AISdkCallOptions = {};

    if (settings.temperature !== undefined) {
      options.temperature = settings.temperature;
    }
    if (settings.topP !== undefined) {
      options.topP = settings.topP;
    }
    if (settings.maxTokens !== undefined) {
      options.maxOutputTokens = settings.maxTokens;
    }
    if (settings.frequencyPenalty !== undefined) {
      options.frequencyPenalty = settings.frequencyPenalty;
    }
    if (settings.presencePenalty !== undefined) {
      options.presencePenalty = settings.presencePenalty;
    }
    if (settings.toolChoice !== undefined) {
      options.toolChoice = TOOL_CHOICE.encode(settings.toolChoice);
    }
    if (settings.providerOptions !== undefined) {
      options.providerOptions =
        settings.providerOptions as SharedV3ProviderOptions;
    }

    // TODO: Handle reasoning settings (settings.reasoning)
    // TODO: Handle text settings (settings.text)
    // TODO: Handle parallelToolCalls (not in AI SDK v3 base interface)
    // These may need to be mapped to provider-specific options

    return options;
  },
  decode: () => {
    throw new Error("codec:unimplemented");
  },
};
