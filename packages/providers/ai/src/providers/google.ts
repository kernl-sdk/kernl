import { google as _google } from "@ai-sdk/google";
import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

/**
 * Google Generative AI model IDs.
 */
type GoogleGenerativeAIModelId =
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-latest"
  | "gemini-1.5-flash-001"
  | "gemini-1.5-flash-002"
  | "gemini-1.5-flash-8b"
  | "gemini-1.5-flash-8b-latest"
  | "gemini-1.5-flash-8b-001"
  | "gemini-1.5-pro"
  | "gemini-1.5-pro-latest"
  | "gemini-1.5-pro-001"
  | "gemini-1.5-pro-002"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-001"
  | "gemini-2.0-flash-live-001"
  | "gemini-2.0-flash-lite"
  | "gemini-2.0-pro-exp-02-05"
  | "gemini-2.0-flash-thinking-exp-01-21"
  | "gemini-2.0-flash-exp"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-image-preview"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-lite-preview-09-2025"
  | "gemini-2.5-flash-preview-04-17"
  | "gemini-2.5-flash-preview-09-2025"
  | "gemini-pro-latest"
  | "gemini-flash-latest"
  | "gemini-flash-lite-latest"
  | "gemini-2.5-pro-exp-03-25"
  | "gemini-exp-1206"
  | "gemma-3-12b-it"
  | "gemma-3-27b-it"
  | (string & {});

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
export function google(modelId: GoogleGenerativeAIModelId) {
  const model = _google(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register Google embedding provider
registerEmbeddingProvider(
  "google",
  (id) => new AISDKEmbeddingModel(_google.textEmbedding(id)),
);
