import { google as _google } from "@ai-sdk/google";
import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

/**
 * Create a kernl-compatible Google Generative AI language model.
 *
 * @example
 * ```ts
 * import { google } from '@kernl-sdk/ai/google';
 *
 * const gemini = google('gemini-2.0-flash-exp');
 * const response = await gemini.generate([...], {});
 * ```
 */
export function google(modelId: string) {
  const model = _google(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register Google embedding provider
registerEmbeddingProvider(
  "google",
  (id) => new AISDKEmbeddingModel(_google.textEmbedding(id)),
);
