import { openai as createOpenAIModel } from "@ai-sdk/openai";
import { AISDKLanguageModel } from "../language-model";

/**
 * Create a kernl-compatible OpenAI language model.
 *
 * @example
 * ```ts
 * import { openai } from '@kernl/ai/openai';
 *
 * const gpt4 = openai('gpt-4-turbo');
 * const response = await gpt4.generate([...], {});
 * ```
 */
export function openai(modelId: string) {
  const model = createOpenAIModel(modelId);
  return new AISDKLanguageModel(model);
}
