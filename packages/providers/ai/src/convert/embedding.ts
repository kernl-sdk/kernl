import type { Codec } from "@kernl-sdk/shared/lib";
import type { EmbeddingModelRequestSettings } from "@kernl-sdk/protocol";
import type { SharedV3ProviderOptions } from "@ai-sdk/provider";

/**
 * AI SDK embedding call options extracted from settings.
 */
export interface AISdkEmbeddingOptions {
  dimensions?: number;
  providerOptions?: SharedV3ProviderOptions;
}

export const EMBEDDING_SETTINGS: Codec<
  EmbeddingModelRequestSettings,
  AISdkEmbeddingOptions
> = {
  encode: (settings: EmbeddingModelRequestSettings) => {
    const options: AISdkEmbeddingOptions = {};

    if (settings.dimensions !== undefined) {
      options.dimensions = settings.dimensions;
    }
    if (settings.providerOptions !== undefined) {
      options.providerOptions =
        settings.providerOptions as SharedV3ProviderOptions;
    }

    return options;
  },
  decode: () => {
    throw new Error("codec:unimplemented");
  },
};
