import { OpenAIRealtimeModel, type OpenAIRealtimeOptions } from "./realtime/model";

/**
 * OpenAI provider interface.
 */
export interface OpenAIProvider {
  /**
   * Create a realtime model.
   *
   * @example
   * ```ts
   * import { openai } from '@kernl-sdk/openai';
   *
   * const model = openai.realtime('gpt-4o-realtime-preview');
   * ```
   *
   * @example
   * ```ts
   * const model = openai.realtime('gpt-4o-realtime-preview', {
   *   apiKey: 'sk-...',
   * });
   * ```
   */
  realtime(modelId: string, options?: OpenAIRealtimeOptions): OpenAIRealtimeModel;
}

/**
 * OpenAI provider.
 *
 * @example
 * ```ts
 * import { openai } from '@kernl-sdk/openai';
 *
 * const model = openai.realtime('gpt-4o-realtime-preview');
 * ```
 */
export const openai: OpenAIProvider = {
  realtime(modelId: string, options?: OpenAIRealtimeOptions) {
    return new OpenAIRealtimeModel(modelId, options);
  },
};
