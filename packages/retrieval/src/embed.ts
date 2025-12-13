import type { EmbeddingModel } from "@kernl-sdk/protocol";

/**
 * Embed a single text value.
 *
 * @example
 * ```ts
 * import { embed } from '@kernl-sdk/retrieval';
 * import { openai } from '@kernl-sdk/ai/openai';
 *
 * const { embedding } = await embed({
 *   model: 'openai/text-embedding-3-small',
 *   text: 'sunny day at the beach',
 *   retries: 2,
 * });
 * ```
 */
export async function embed(options: {
  model: string;
  text: string;
  retries?: number;
  abortSignal?: AbortSignal;
}): Promise<{ embedding: number[] }> {
  const model = resolveEmbeddingModel(options.model);
  const maxRetries = options.retries ?? 2;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.embed({
        values: [options.text],
        abort: options.abortSignal,
      });
      return { embedding: result.embeddings[0] ?? [] };
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries && !options.abortSignal?.aborted) {
        // exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100),
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError!;
}

/**
 * Embed multiple text values.
 *
 * @example
 * ```ts
 * import { embedMany } from '@kernl-sdk/retrieval';
 * import { openai } from '@kernl-sdk/ai/openai';
 *
 * const { embeddings } = await embedMany({
 *   model: 'openai/text-embedding-3-small',
 *   texts: ['hello', 'world'],
 *   concurrency: 5,
 * });
 * ```
 */
export async function embedMany(options: {
  model: string;
  texts: string[];
  retries?: number;
  abortSignal?: AbortSignal;
  concurrency?: number;
}): Promise<{ embeddings: number[][] }> {
  const model = resolveEmbeddingModel(options.model);
  const maxRetries = options.retries ?? 2;
  const concurrency = options.concurrency ?? Infinity;

  // batch by model's maxEmbeddingsPerCall if available
  const batchSize = model.maxEmbeddingsPerCall ?? options.texts.length;
  const batches: string[][] = [];
  for (let i = 0; i < options.texts.length; i += batchSize) {
    batches.push(options.texts.slice(i, i + batchSize));
  }

  // process batches with concurrency limit
  const results: number[][] = [];
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      chunk.map((batch) =>
        embedBatch(model, batch, maxRetries, options.abortSignal),
      ),
    );
    results.push(...batchResults.flat());
  }

  return { embeddings: results };
}

async function embedBatch(
  model: EmbeddingModel,
  texts: string[],
  maxRetries: number,
  abortSignal?: AbortSignal,
): Promise<number[][]> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.embed({
        values: texts,
        abort: abortSignal,
      });
      return result.embeddings;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries && !abortSignal?.aborted) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100),
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError!;
}

/**
 * Resolve an embedding model from a provider/model-id string.
 *
 * @example
 * ```ts
 * import { resolveEmbeddingModel } from '@kernl-sdk/retrieval';
 * import '@kernl-sdk/ai/openai'; // registers provider
 *
 * const model = resolveEmbeddingModel('openai/text-embedding-3-small');
 * const result = await model.embed({ values: ['hello world'] });
 * ```
 */
export function resolveEmbeddingModel<TValue = string>(
  modelId: string,
): EmbeddingModel<TValue> {
  const [provider, id] = parseModel(modelId);
  const factory = PROVIDERS[provider];

  if (!factory) {
    throw new Error(
      `Unknown provider: ${provider}. Did you import the provider package? (e.g., '@kernl-sdk/ai/openai')`,
    );
  }

  return factory(id) as EmbeddingModel<TValue>;
}

function parseModel(model: string): [string, string] {
  const idx = model.indexOf("/");
  if (idx === -1) {
    throw new Error(
      `Invalid model format: ${model}. Expected 'provider/model-id'`,
    );
  }
  return [model.slice(0, idx), model.slice(idx + 1)];
}

type EmbeddingFactory = (id: string) => EmbeddingModel<any>;

// (TODO): this needs to be considered why this should be here..
const PROVIDERS: Record<string, EmbeddingFactory> = {};

/**
 * Register an embedding provider.
 * Typically called automatically when importing provider packages.
 *
 * @example
 * ```ts
 * import { openai } from '@ai-sdk/openai';
 * import { AISDKEmbeddingModel } from '@kernl-sdk/ai';
 *
 * registerEmbeddingProvider('openai', (id) =>
 *   new AISDKEmbeddingModel(openai.embedding(id))
 * );
 * ```
 */
export function registerEmbeddingProvider(
  name: string,
  factory: EmbeddingFactory,
): void {
  PROVIDERS[name] = factory;
}
