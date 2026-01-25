import { xai as _xai, createXai as _createXai } from "@ai-sdk/xai";
import { AISDKLanguageModel } from "../language-model";

/**
 * xAI model IDs (derived from @ai-sdk/xai).
 */
export type XaiModelId = Parameters<typeof _xai>[0];

/**
 * Options for creating a custom xAI provider.
 */
export interface XaiProviderOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Custom base URL */
  baseURL?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create a custom xAI provider with explicit credentials.
 *
 * @example
 * ```ts
 * const xai = createXai({ apiKey: "xai-..." });
 * const model = xai("grok-3");
 * ```
 */
export function createXai(options: XaiProviderOptions = {}) {
  const provider = _createXai({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    headers: options.headers,
  });

  return (modelId: XaiModelId) => new AISDKLanguageModel(provider(modelId));
}

/**
 * Create a kernl-compatible xAI language model.
 * Uses XAI_API_KEY environment variable.
 *
 * @example
 * ```ts
 * import { xai } from '@kernl-sdk/ai/xai';
 *
 * const grok = xai('grok-3');
 * const response = await grok.generate([...], {});
 * ```
 */
export function xai(modelId: XaiModelId) {
  const model = _xai(modelId);
  return new AISDKLanguageModel(model);
}

// Note: xAI does not currently support embeddings
