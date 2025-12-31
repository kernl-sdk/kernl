import { GrokRealtimeModel, type GrokRealtimeOptions } from "./realtime/model";

/**
 * xAI provider interface.
 */
export interface XAIProvider {
  /**
   * Create a Grok realtime voice model.
   *
   * @example
   * ```ts
   * import { xai } from '@kernl-sdk/xai';
   *
   * const model = xai.realtime();
   * ```
   *
   * @example
   * ```ts
   * const model = xai.realtime({
   *   apiKey: 'xai-...',
   * });
   * ```
   */
  realtime(options?: GrokRealtimeOptions): GrokRealtimeModel;
}

/**
 * xAI provider.
 *
 * @example
 * ```ts
 * import { xai } from '@kernl-sdk/xai';
 *
 * const model = xai.realtime();
 * ```
 */
export const xai: XAIProvider = {
  realtime(options?: GrokRealtimeOptions) {
    return new GrokRealtimeModel(options);
  },
};
