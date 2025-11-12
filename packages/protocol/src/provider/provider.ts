import { EmbeddingModel } from "@/embedding-model";
import { LanguageModel } from "@/language-model";
import { JSONObject } from "@/json";

/**
 * Provider for language, text embedding, and image generation models.
 */
export interface Provider {
  readonly spec: "1.0";

  /**
   * Returns the language model with the given id.
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  languageModel(modelId: string): LanguageModel;

  /**
   * Returns the text embedding model with the given id.
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  textEmbeddingModel(modelId: string): EmbeddingModel<string>;

  // /**
  //  * Returns the image model with the given id.
  //  *
  //  * @param modelId - The id of the model to return.
  //  * @returns The image model associated with the id.
  //  */
  // imageModel(modelId: string): ImageModelV3;

  // /**
  //  * Returns the transcription model with the given id.
  //  *
  //  * @param modelId - The id of the model to return.
  //  * @returns The transcription model associated with the id.
  //  */
  // transcriptionModel?(modelId: string): TranscriptionModelV3;

  // /**
  //  * Returns the speech model with the given id.
  //  *
  //  * @param modelId - The id of the model to return.
  //  * @returns The speech model associated with the id.
  //  */
  // speechModel?(modelId: string): SpeechModelV3;

  // /**
  //  * Returns the reranking model with the given id.
  //  *
  //  * @param modelId - The id of the model to return.
  //  * @returns The reranking model associated with the id.
  //  * @throws {NoSuchModelError} If no such model exists.
  //  */
  // rerankingModel?(modelId: string): RerankingModelV3;
}

/**
 * Additional provider-specific metadata.
 *
 * They are passed through to the provider from the AI SDK
 * and enable provider-specific functionality
 * that can be fully encapsulated in the provider.
 *
 * The outer record is keyed by the provider name, and the inner
 * record is keyed by the provider-specific metadata key.
 *
 * ```ts
 * {
 *   "anthropic": {
 *     "cacheControl": { "type": "ephemeral" }
 *   }
 * }
 * ```
 */
export type SharedProviderMetadata = Record<string, JSONObject>;

export type SharedProviderOptions = Record<string, JSONObject>;
