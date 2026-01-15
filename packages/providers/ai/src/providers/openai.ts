import { openai as _openai } from "@ai-sdk/openai";
import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

/**
 * OpenAI model IDs.
 */
type OpenAIModelId =
  | "chatgpt-4o-latest"
  | "gpt-3.5-turbo-0125"
  | "gpt-3.5-turbo-1106"
  | "gpt-3.5-turbo"
  | "gpt-4-0613"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-turbo"
  | "gpt-4.1-2025-04-14"
  | "gpt-4.1-mini-2025-04-14"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano-2025-04-14"
  | "gpt-4.1-nano"
  | "gpt-4.1"
  | "gpt-4"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4o-mini"
  | "gpt-4o"
  | "gpt-5-2025-08-07"
  | "gpt-5-chat-latest"
  | "gpt-5-codex"
  | "gpt-5-mini-2025-08-07"
  | "gpt-5-mini"
  | "gpt-5-nano-2025-08-07"
  | "gpt-5-nano"
  | "gpt-5-pro-2025-10-06"
  | "gpt-5-pro"
  | "gpt-5"
  | "o1-2024-12-17"
  | "o1"
  | "o3-2025-04-16"
  | "o3-mini-2025-01-31"
  | "o3-mini"
  | "o3"
  | (string & {});

/**
 * Create a kernl-compatible OpenAI language model.
 *
 * @example
 * ```ts
 * import { openai } from '@kernl-sdk/ai/openai';
 *
 * const gpt4 = openai('gpt-4o');
 * const response = await gpt4.generate([...], {});
 * ```
 */
export function openai(modelId: OpenAIModelId) {
  const model = _openai(modelId);
  return new AISDKLanguageModel(model);
}

// Auto-register OpenAI embedding provider
registerEmbeddingProvider(
  "openai",
  (id) => new AISDKEmbeddingModel(_openai.embedding(id)),
);
