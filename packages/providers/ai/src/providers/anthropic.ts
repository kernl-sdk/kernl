import { anthropic as createAnthropicModel } from "@ai-sdk/anthropic";
import { AISDKLanguageModel } from "../language-model";

/**
 * Create a kernl-compatible Anthropic language model.
 *
 * @example
 * ```ts
 * import { anthropic } from '@kernl-sdk/ai/anthropic';
 *
 * const claude = anthropic('claude-3-5-sonnet-20241022');
 * const response = await claude.generate([...], {});
 * ```
 */
export function anthropic(modelId: string) {
  const model = createAnthropicModel(modelId);
  return new AISDKLanguageModel(model);
}

// Note: Anthropic does not currently support embeddings
