import { SharedProviderMetadata } from "@/provider";

import { EmbeddingModelRequest } from "./request";

/**
 * An embedding is a vector, i.e. an array of numbers.
 * It is e.g. used to represent a text as a vector of word embeddings.
 */
export type Embedding = number[];

/**
 * Embedding model interface.
 *
 * TValue is the type of values that can be embedded.
 * Currently string for text, but could support images, audio, etc. in the future.
 */
export interface EmbeddingModel<TValue = string> {
  /**
   * The embedding model must specify which embedding model interface version it implements.
   */
  readonly spec: "1.0";

  /**
   * Provider ID.
   */
  readonly provider: string;

  /**
   * Provider-specific model ID.
   */
  readonly modelId: string;

  /**
   * Maximum number of values that can be embedded in a single call.
   * undefined means no limit is known.
   */
  readonly maxEmbeddingsPerCall?: number;

  /**
   * Whether this model can handle multiple embed calls in parallel.
   */
  readonly supportsParallelCalls?: boolean;

  /**
   * Generate embeddings for the given input values.
   *
   * @param request - The embedding request.
   */
  embed(
    request: EmbeddingModelRequest<TValue>,
  ): Promise<EmbeddingModelResponse>;
}

/**
 * The response from an embedding model.
 */
export interface EmbeddingModelResponse {
  /**
   * Generated embeddings in the same order as input values.
   */
  embeddings: Embedding[];

  /**
   * Token usage for the embedding call.
   */
  usage: EmbeddingModelUsage;

  /**
   * Provider-specific metadata.
   */
  providerMetadata?: SharedProviderMetadata;
}

/**
 * Usage information for an embedding model call.
 */
export interface EmbeddingModelUsage {
  /**
   * The number of input tokens used.
   */
  inputTokens: number | undefined;
}
