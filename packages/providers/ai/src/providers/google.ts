import { google as _google } from "@ai-sdk/google";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";
import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";

/**
 * Google model IDs (derived from @ai-sdk/google).
 */
export type GoogleModelId = Parameters<typeof _google>[0];

/**
 * Create a kernl-compatible Google Generative AI language model.
 *
 * @example
 * ```ts
 * import { google } from '@kernl-sdk/ai/google';
 *
 * const gemini = google('gemini-2.5-pro');
 * const response = await gemini.generate([...], {});
 * ```
 */
export function google(modelId: GoogleModelId) {
  const model = _google(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register Google embedding provider
registerEmbeddingProvider(
  "google",
  (id) => new AISDKEmbeddingModel(_google.textEmbedding(id)),
);
