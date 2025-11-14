import { google as createGoogleModel } from "@ai-sdk/google";
import { AISDKLanguageModel } from "../language-model";

/**
 * Create a kernl-compatible Google Generative AI language model.
 *
 * @example
 * ```ts
 * import { google } from '@kernl-sdk/ai/google';
 *
 * const gemini = google('gemini-2.0-flash-exp');
 * const response = await gemini.generate([...], {});
 * ```
 */
export function google(modelId: string) {
  const model = createGoogleModel(modelId);
  return new AISDKLanguageModel(model);
}
