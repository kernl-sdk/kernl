/**
 * @kernl-sdk/ai - AI SDK adapter for kernl
 *
 * Universal provider support via Vercel AI SDK v5.
 *
 * @example
 * ```ts
 * import { anthropic } from '@kernl-sdk/ai/anthropic';
 *
 * const claude = anthropic('claude-3-5-sonnet-20241022');
 * const response = await claude.generate([...], {});
 * ```
 */

export { AISDKLanguageModel } from "./language-model";

// Re-export codecs for custom provider implementations
export { MESSAGE } from "./convert/message";
export { TOOL, TOOL_CHOICE } from "./convert/tools";
export { MODEL_SETTINGS } from "./convert/settings";
export { MODEL_RESPONSE, WARNING } from "./convert/response";
export { convertStream } from "./convert/stream";
export { UIMessageCodec, historyToUIMessages } from "./convert/ui-message";
export { STREAM_UI_PART, toUIMessageStream } from "./convert/ui-stream";
