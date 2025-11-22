import type {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
  LanguageModelItem,
  LanguageModelStreamEvent,
} from "@kernl-sdk/protocol";

/**
 * Helper to convert LanguageModelResponse content to stream events.
 * Yields both delta events (for streaming UX) and complete items (for history).
 */
async function* streamFromResponse(
  response: LanguageModelResponse,
): AsyncGenerator<LanguageModelStreamEvent> {
  for (const item of response.content) {
    if (item.kind === "message") {
      // Stream message with text deltas
      for (const contentItem of item.content) {
        if (contentItem.kind === "text") {
          // Yield text-start
          yield {
            kind: "text-start" as const,
            id: item.id,
          };
          // Yield text-delta
          yield {
            kind: "text-delta" as const,
            id: item.id,
            text: contentItem.text,
          };
          // Yield text-end
          yield {
            kind: "text-end" as const,
            id: item.id,
          };
        }
      }
      // Yield complete message
      yield item;
    } else {
      // For tool-call, reasoning, tool-result - just yield as-is
      yield item;
    }
  }
  // Yield finish event
  yield {
    kind: "finish" as const,
    finishReason: response.finishReason,
    usage: response.usage,
  };
}

/**
 * Creates a mock LanguageModel that automatically implements streaming
 * based on the generate() implementation.
 */
export function createMockModel(generateFn: any): any {
  return {
    spec: "1.0" as const,
    provider: "test",
    modelId: "test-model",
    generate: generateFn,
    stream: async function* (req: any) {
      const response = await generateFn(req);
      yield* streamFromResponse(response);
    },
  };
}
