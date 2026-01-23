import {
  mistral as _mistral,
  createMistral as _createMistral,
} from "@ai-sdk/mistral";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";

/**
 * Mistral model IDs (derived from @ai-sdk/mistral).
 */
export type MistralModelId = Parameters<typeof _mistral>[0];

/**
 * Options for creating a custom Mistral provider.
 */
export interface MistralProviderOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Custom base URL */
  baseURL?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create a custom Mistral provider with explicit credentials.
 *
 * @example
 * ```ts
 * const mistral = createMistral({ apiKey: "..." });
 * const model = mistral("mistral-large-latest");
 * ```
 */
export function createMistral(options: MistralProviderOptions = {}) {
  const provider = _createMistral({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    headers: options.headers,
  });

  return (modelId: MistralModelId) => new AISDKLanguageModel(provider(modelId));
}

/**
 * Create a kernl-compatible Mistral language model.
 * Uses MISTRAL_API_KEY environment variable.
 *
 * @example
 * ```ts
 * import { mistral } from '@kernl-sdk/ai/mistral';
 *
 * const model = mistral('mistral-large-latest');
 * const response = await model.generate([...], {});
 * ```
 */
export function mistral(modelId: MistralModelId) {
  const model = _mistral(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register Mistral embedding provider
registerEmbeddingProvider(
  "mistral",
  (id) => new AISDKEmbeddingModel(_mistral.embedding(id)),
);
