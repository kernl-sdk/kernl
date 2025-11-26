/**
 * Configuration for the Turbopuffer search index.
 */
export interface TurbopufferConfig {
  /**
   * Turbopuffer API key.
   * Falls back to TURBOPUFFER_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Turbopuffer region (e.g. "us-east-1").
   * Falls back to TURBOPUFFER_REGION environment variable.
   */
  region?: string;
}
