import { anthropic as _anthropic } from "@ai-sdk/anthropic";
import { AISDKLanguageModel } from "../language-model";

/**
 * Anthropic model IDs.
 */
export type AnthropicModelId =
  | "claude-haiku-4-5"
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-5"
  | "claude-sonnet-4-5-20250929"
  | "claude-opus-4-1"
  | "claude-opus-4-0"
  | "claude-sonnet-4-0"
  | "claude-opus-4-1-20250805"
  | "claude-opus-4-20250514"
  | "claude-sonnet-4-20250514"
  | "claude-3-7-sonnet-latest"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-haiku-latest"
  | "claude-3-5-haiku-20241022"
  | "claude-3-haiku-20240307"
  | (string & {});

/**
 * Create a kernl-compatible Anthropic language model.
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
