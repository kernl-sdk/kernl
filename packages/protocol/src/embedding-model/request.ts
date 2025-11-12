import { SharedProviderOptions } from "@/provider";

export interface EmbeddingModelRequest<TValue = string> {
  /**
   * Values to embed.
   */
  values: TValue[];

  /**
   * Optional settings for the embedding request.
   */
  settings?: EmbeddingModelRequestSettings;

  /**
   * Abort signal for cancelling the operation.
   */
  abort?: AbortSignal;
}

export interface EmbeddingModelRequestSettings {
  /**
   * Desired dimension of the output embeddings.
   * Not supported by all providers.
   */
  dimensions?: number;

  /**
   * Additional provider-specific options.
   */
  providerOptions?: SharedProviderOptions;
}
