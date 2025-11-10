import {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
} from "@/model";
import { Usage } from "@/usage";
import type { ThreadEvent, ThreadStreamEvent } from "@/types/thread";

/**
 * A mock language model that echoes the user input back as an assistant message.
 * Useful for testing the execution flow without calling a real LLM.
 *
 * (TODO): Support tool calls for testing.
 */
export class MockLanguageModel implements LanguageModel {
  async generate(
    request: LanguageModelRequest,
  ): Promise<LanguageModelResponse> {
    // Extract user message text from input
    const userText = this.extractUserText(request.input);

    // Create assistant message that echoes the input
    const events: ThreadEvent[] = [
      {
        kind: "message",
        id: this.generateId(),
        role: "assistant",
        content: [
          {
            kind: "text",
            text: userText,
          },
        ],
      },
    ];

    // Return with fake usage stats
    return {
      events,
      usage: new Usage({
        requests: 1,
        inputTokens: this.countTokens(userText),
        outputTokens: this.countTokens(userText),
        totalTokens: this.countTokens(userText) * 2,
      }),
    };
  }

  async *stream(
    request: LanguageModelRequest,
  ): AsyncIterable<ThreadStreamEvent> {
    // TODO: Implement streaming (not needed for hello world)
    throw new Error("MockLanguageModel.stream() not implemented yet");
  }

  /**
   * Extract text from the input (string or ModelItem[])
   */
  private extractUserText(input: string | ThreadEvent[]): string {
    if (typeof input === "string") {
      return input;
    }

    // Extract text from ModelItem array
    const text: string[] = [];
    for (const item of input) {
      if (item.kind === "message" && item.role === "user") {
        for (const part of item.content) {
          if (part.kind === "text") {
            text.push(part.text);
          }
        }
      }
    }

    return text.join(" ");
  }

  /**
   * Simple token counter (fake approximation)
   */
  private countTokens(text: string): number {
    // Rough approximation: 1 token H 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate a simple ID for messages
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
