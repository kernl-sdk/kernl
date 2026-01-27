/**
 * System toolkits.
 *
 * Optional toolkits that can be added to agents for common functionality.
 *
 * @example
 * ```ts
 * import { Agent } from "kernl";
 * import { memory } from "kernl/systools";
 *
 * const agent = new Agent({
 *   id: "jarvis",
 *   model: anthropic("claude-sonnet-4-5"),
 *   instructions: "...",
 *   toolkits: [memory],
 * });
 * ```
 */

export { memory } from "./tool/sys";
