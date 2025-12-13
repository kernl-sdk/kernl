import { openai as _openai } from "@ai-sdk/openai";
import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

/**
 * Create a kernl-compatible OpenAI language model.
 *
 * @example
 * ```ts
 * import { openai } from '@kernl-sdk/ai/openai';
 *
 * const gpt4 = openai('gpt-4-turbo');
 * const response = await gpt4.generate([...], {});
 * ```
 */
export function openai(modelId: string) {
  const model = _openai(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register OpenAI embedding provider
registerEmbeddingProvider(
  "openai",
  (id) => new AISDKEmbeddingModel(_openai.embedding(id)),
);
