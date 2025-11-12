import type { LanguageModelV3 } from "@ai-sdk/provider";

import type {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
  LanguageModelStreamEvent,
} from "@kernl-sdk/protocol";

import { MESSAGE } from "./convert/message";
import { TOOL } from "./convert/tools";
import { MODEL_SETTINGS } from "./convert/settings";
import { MODEL_RESPONSE } from "./convert/response";
import { convertStream } from "./convert/stream";
import { wrapError } from "./error";

/**
 * LanguageModel adapter for the AI SDK LanguageModelV3.
 */
export class AISDKLanguageModel implements LanguageModel {
  readonly spec = "1.0" as const;
  readonly provider: string;
  readonly modelId: string;

  constructor(private model: LanguageModelV3) {
    this.provider = model.provider;
    this.modelId = model.modelId;
  }

  /**
   * Get a response from the model.
   */
  async generate(
    request: LanguageModelRequest,
  ): Promise<LanguageModelResponse> {
    try {
      const messages = request.input.map(MESSAGE.encode);
      const tools = request.tools ? request.tools.map(TOOL.encode) : undefined;
      const settings = MODEL_SETTINGS.encode(request.settings);

      const result = await this.model.doGenerate({
        prompt: messages,
        tools,
        ...settings,
        abortSignal: request.abort,
      });

      return MODEL_RESPONSE.decode(result);
    } catch (error) {
      throw wrapError(error, "generate");
    }
  }

  /**
   * Get a streamed response from the model.
   */
  async *stream(
    request: LanguageModelRequest,
  ): AsyncIterable<LanguageModelStreamEvent> {
    try {
      const messages = request.input.map(MESSAGE.encode);
      const tools = request.tools ? request.tools.map(TOOL.encode) : undefined;
      const settings = MODEL_SETTINGS.encode(request.settings);

      const stream = await this.model.doStream({
        prompt: messages,
        tools,
        ...settings,
        abortSignal: request.abort,
      });

      yield* convertStream(stream.stream);
    } catch (error) {
      throw wrapError(error, "stream");
    }
  }
}
