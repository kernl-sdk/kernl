import type { EmbeddingModelV3 } from "@ai-sdk/provider";
import type {
  EmbeddingModel,
  EmbeddingModelRequest,
  EmbeddingModelResponse,
} from "@kernl-sdk/protocol";

import { EMBEDDING_SETTINGS } from "./convert/embedding";

/**
 * EmbeddingModel adapter for the AI SDK EmbeddingModelV3.
 */
export class AISDKEmbeddingModel<TValue = string>
  implements EmbeddingModel<TValue>
{
  readonly spec = "1.0" as const;
  readonly provider: string;
  readonly modelId: string;
  readonly maxEmbeddingsPerCall?: number;
  readonly supportsParallelCalls?: boolean;

  constructor(private model: EmbeddingModelV3<TValue>) {
    this.provider = model.provider;
    this.modelId = model.modelId;

    // AI SDK supports async values for these, we handle sync case
    if (typeof model.maxEmbeddingsPerCall === "number") {
      this.maxEmbeddingsPerCall = model.maxEmbeddingsPerCall;
    }
    if (typeof model.supportsParallelCalls === "boolean") {
      this.supportsParallelCalls = model.supportsParallelCalls;
    }
  }

  async embed(
    request: EmbeddingModelRequest<TValue>,
  ): Promise<EmbeddingModelResponse> {
    const settings = request.settings
      ? EMBEDDING_SETTINGS.encode(request.settings)
      : {};

    const result = await this.model.doEmbed({
      values: request.values,
      abortSignal: request.abort,
      ...settings,
    });

    return {
      embeddings: result.embeddings,
      usage: { inputTokens: result.usage?.tokens },
      providerMetadata: result.providerMetadata,
    };
  }
}
