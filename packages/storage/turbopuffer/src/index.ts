/**
 * Turbopuffer search index adapter.
 */

import { TurbopufferSearchIndex } from "./search";
import type { TurbopufferConfig } from "./types";

export { TurbopufferSearchIndex } from "./search";
export { TurbopufferIndexHandle } from "./handle";
export type { TurbopufferConfig } from "./types";

/**
 * Create a Turbopuffer search index.
 *
 * @param config - Turbopuffer API key and region
 * @returns SearchIndex instance backed by Turbopuffer
 *
 * @example
 * ```ts
 * const tpuf = turbopuffer({
 *   apiKey: "your-api-key",
 *   region: "us-east-1",
 * });
 *
 * const docs = tpuf.index("my-index");
 * await docs.upsert({ id: "doc-1", fields: { text: "Hello" } });
 * ```
 */
export function turbopuffer(config: TurbopufferConfig) {
  return new TurbopufferSearchIndex(config);
}
