import type { LanguageModelV3 } from "@ai-sdk/provider";

import type {
  LanguageModel,
  LanguageModelRequest,
  LanguageModelResponse,
  LanguageModelStreamEvent,
} from "@kernl-sdk/protocol";
import { message, reasoning } from "@kernl-sdk/protocol";

import { MESSAGE } from "./convert/message";
import { TOOL } from "./convert/tools";
import { MODEL_SETTINGS } from "./convert/settings";
import { MODEL_RESPONSE } from "./convert/response";
import { convertStream } from "./convert/stream";

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
  }

  /**
   * Get a streamed response from the model.
   */
  async *stream(
    request: LanguageModelRequest,
  ): AsyncIterable<LanguageModelStreamEvent> {
    const messages = request.input.map(MESSAGE.encode);
    const tools = request.tools ? request.tools.map(TOOL.encode) : undefined;
    const settings = MODEL_SETTINGS.encode(request.settings);

    const stream = await this.model.doStream({
      prompt: messages,
      tools,
      ...settings,
      abortSignal: request.abort,
    });

    // text + reasoning buffers for delta accumulation
    const tbuf: Record<string, string> = {};
    const rbuf: Record<string, string> = {};

    for await (const event of convertStream(stream.stream)) {
      switch (event.kind) {
        case "text-start": {
          tbuf[event.id] = "";
          yield event;
          break;
        }

        case "text-delta": {
          if (tbuf[event.id] !== undefined) {
            tbuf[event.id] += event.text;
          }
          yield event;
          break;
        }

        case "text-end": {
          const text = tbuf[event.id];
          if (text !== undefined) {
            yield message({
              role: "assistant",
              text,
              providerMetadata: event.providerMetadata,
            });
            delete tbuf[event.id];
          }
          yield event;
          break;
        }

        case "reasoning-start": {
          rbuf[event.id] = "";
          yield event;
          break;
        }

        case "reasoning-delta": {
          if (rbuf[event.id] !== undefined) {
            rbuf[event.id] += event.text;
          }
          yield event;
          break;
        }

        case "reasoning-end": {
          const text = rbuf[event.id];
          if (text !== undefined) {
            yield reasoning({
              text,
              providerMetadata: event.providerMetadata,
            });
            delete rbuf[event.id];
          }
          yield event;
          break;
        }

        default:
          // all other events (tool-call, tool-result, finish, etc.) pass through
          yield event;
          break;
      }
    }
  }
}
