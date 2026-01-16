import {
  openai as _openai,
  createOpenAI as _createOpenAI,
} from "@ai-sdk/openai";
import { registerEmbeddingProvider } from "@kernl-sdk/retrieval";

import { AISDKLanguageModel } from "../language-model";
import { AISDKEmbeddingModel } from "../embedding-model";
import { createOAuthFetch } from "../oauth/openai";
import type { OpenAIOAuthCredentials } from "../oauth/types";

/**
 * OpenAI model IDs (derived from @ai-sdk/openai).
 */
export type OpenAIModelId = Parameters<typeof _openai>[0];

/**
 * Options for creating a custom OpenAI provider.
 */
export interface OpenAIProviderOptions {
  /** API key for standard authentication */
  apiKey?: string;
  /** OAuth credentials for ChatGPT Plus/Pro (Codex) authentication */
  oauth?: OpenAIOAuthCredentials;
  /** Custom base URL (ignored for OAuth - uses Codex endpoint) */
  baseURL?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create a custom OpenAI provider with explicit credentials.
 *
 * @example API key auth
 * ```ts
 * const openai = createOpenAI({ apiKey: "sk-..." });
 * const model = openai("gpt-4o");
 * ```
 *
 * @example OAuth auth (ChatGPT Plus/Pro via Codex)
 * ```ts
 * const openai = createOpenAI({
 *   oauth: {
 *     accessToken: "...",
 *     refreshToken: "...",
 *     expiresAt: Date.now() + 3600000,
 *     accountId: "...", // for org subscriptions
 *     onRefresh: (tokens) => saveTokens(tokens),
 *   }
 * });
 * const model = openai("gpt-4o");
 * ```
 */
export function createOpenAI(options: OpenAIProviderOptions = {}) {
  const provider = _createOpenAI({
    apiKey: options.oauth ? undefined : options.apiKey,
    baseURL: options.oauth ? undefined : options.baseURL,
    headers: options.headers,
    fetch: options.oauth ? createOAuthFetch(options.oauth) : undefined,
  });

  // OAuth requires store: false - Codex endpoint doesn't persist items
  const settings = options.oauth
    ? { providerOptions: { openai: { store: false } } }
    : undefined;

  return (modelId: OpenAIModelId) =>
    new AISDKLanguageModel(provider(modelId), settings);
}

/**
 * Create a kernl-compatible OpenAI language model.
 * Uses OPENAI_API_KEY environment variable.
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

// Re-export types
export type { OpenAIOAuthCredentials } from "../oauth/types";

// Auto-register OpenAI embedding provider
registerEmbeddingProvider(
  "openai",
  (id) => new AISDKEmbeddingModel(_openai.embedding(id)),
);
