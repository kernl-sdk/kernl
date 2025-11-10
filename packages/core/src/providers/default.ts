import type {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
} from "@/model";
import type { ThreadStreamEvent } from "@/types/thread";

// (TEMPORARY)

/**
 * Default language model that throws an error when used.
 * This is used as a fallback when no model is provided to an Agent.
 */
class DefaultLanguageModel implements LanguageModel {
  async generate(
    request: LanguageModelRequest,
  ): Promise<LanguageModelResponse> {
    throw new Error(
      "No language model configured. Please provide a model to the Agent.",
    );
  }

  async *stream(
    request: LanguageModelRequest,
  ): AsyncIterable<ThreadStreamEvent> {
    throw new Error(
      "No language model configured. Please provide a model to the Agent.",
    );
  }
}

/**
 * Singleton instance of the default language model
 */
export const DEFAULT_LANGUAGE_MODEL = new DefaultLanguageModel();
