/**
 * Bidirectional codec for converting between kernl protocol types and provider-specific types.
 *
 * @example
 * ```typescript
 * const tools: Codec<LanguageModelTool[], ProviderTool[]> = {
 *   encode: (tools: Tool[]) => tools.map(convertToProvider),
 *   decode: () => { throw new Error("codec:unimplemented"); },
 * };
 * ```
 */
export interface Codec<TKernl, TProvider> {
  /**
   * Transform from kernl protocol format to provider format.
   */
  encode: (value: TKernl) => TProvider;

  /**
   * Transform from provider format to kernl protocol format.
   */
  decode: (value: TProvider) => TKernl;
}
