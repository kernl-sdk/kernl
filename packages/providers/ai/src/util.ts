/**
 * Normalize AI SDK provider strings to base provider ID.
 *
 * AI SDK returns provider strings like:
 * - "anthropic.messages" -> "anthropic"
 * - "openai.responses" -> "openai"
 * - "google.generative-ai" -> "google"
 */
export function normalizeProvider(provider: string): string {
  const dot = provider.indexOf(".");
  return dot !== -1 ? provider.slice(0, dot) : provider;
}
