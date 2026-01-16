import {
  anthropic as _anthropic,
  createAnthropic as _createAnthropic,
} from "@ai-sdk/anthropic";
import { AISDKLanguageModel } from "../language-model";

/**
 * Anthropic model IDs (derived from @ai-sdk/anthropic).
 */
export type AnthropicModelId = Parameters<typeof _anthropic>[0];

/**
 * Options for creating a custom Anthropic provider.
 */
export interface AnthropicProviderOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Custom base URL */
  baseURL?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create a custom Anthropic provider with explicit credentials.
 *
 * @example
 * ```ts
 * const anthropic = createAnthropic({ apiKey: "sk-..." });
 * const model = anthropic("claude-sonnet-4-5");
 * ```
 */
export function createAnthropic(options: AnthropicProviderOptions = {}) {
  const provider = _createAnthropic({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    headers: options.headers,
  });

  return (modelId: AnthropicModelId) =>
    new AISDKLanguageModel(provider(modelId));
}

/**
 * Create a kernl-compatible Anthropic language model.
 * Uses ANTHROPIC_API_KEY environment variable.
 *
 * @example
 * ```ts
 * import { anthropic } from '@kernl-sdk/ai/anthropic';
 *
 * const claude = anthropic('claude-sonnet-4-5');
 * const response = await claude.generate([...], {});
 * ```
 */
export function anthropic(modelId: AnthropicModelId) {
  const model = _anthropic(modelId);
  return new AISDKLanguageModel(model);
}

// Note: Anthropic does not currently support embeddings
