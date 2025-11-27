import { describe, it, expect, vi } from "vitest";
import { embed, embedMany, registerEmbeddingProvider } from "../embed";
import type { EmbeddingModel } from "@kernl-sdk/protocol";

describe("embed", () => {
  it("should embed single text", async () => {
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test1",
      modelId: "test-model",
      embed: vi.fn().mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
        usage: { inputTokens: 10 },
      }),
    };

    registerEmbeddingProvider("test1", () => mockModel);

    const result = await embed({
      model: "test1/test-model",
      text: "hello world",
    });

    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(mockModel.embed).toHaveBeenCalledWith({
      values: ["hello world"],
      abort: undefined,
    });
  });

  it("should retry on failure", async () => {
    let attempts = 0;
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test2",
      modelId: "test-model",
      embed: vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("API error");
        }
        return {
          embeddings: [[0.1, 0.2, 0.3]],
          usage: { inputTokens: 10 },
        };
      }),
    };

    registerEmbeddingProvider("test2", () => mockModel);

    const result = await embed({
      model: "test2/test-model",
      text: "hello",
      retries: 2,
    });

    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(attempts).toBe(2);
  });

  it("should throw after max retries", async () => {
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test3",
      modelId: "test-model",
      embed: vi.fn().mockRejectedValue(new Error("API error")),
    };

    registerEmbeddingProvider("test3", () => mockModel);

    await expect(
      embed({
        model: "test3/test-model",
        text: "hello",
        retries: 1,
      }),
    ).rejects.toThrow("API error");

    expect(mockModel.embed).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it("should respect abort signal", async () => {
    const controller = new AbortController();
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test4",
      modelId: "test-model",
      embed: vi.fn().mockImplementation(async ({ abort }: { abort?: AbortSignal }) => {
        if (abort?.aborted) {
          throw new Error("Aborted");
        }
        return {
          embeddings: [[0.1, 0.2, 0.3]],
          usage: { inputTokens: 10 },
        };
      }),
    };

    registerEmbeddingProvider("test4", () => mockModel);

    controller.abort();

    await expect(
      embed({
        model: "test4/test-model",
        text: "hello",
        abortSignal: controller.signal,
      }),
    ).rejects.toThrow("Aborted");
  });
});

describe("embedMany", () => {
  it("should embed multiple texts", async () => {
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test5",
      modelId: "test-model",
      embed: vi.fn().mockResolvedValue({
        embeddings: [
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6],
        ],
        usage: { inputTokens: 20 },
      }),
    };

    registerEmbeddingProvider("test5", () => mockModel);

    const result = await embedMany({
      model: "test5/test-model",
      texts: ["hello", "world"],
    });

    expect(result.embeddings).toEqual([
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ]);
    expect(mockModel.embed).toHaveBeenCalledWith({
      values: ["hello", "world"],
      abort: undefined,
    });
  });

  it("should batch by maxEmbeddingsPerCall", async () => {
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test6",
      modelId: "test-model",
      maxEmbeddingsPerCall: 2,
      embed: vi
        .fn()
        .mockResolvedValueOnce({
          embeddings: [
            [0.1, 0.2],
            [0.3, 0.4],
          ],
          usage: { inputTokens: 10 },
        })
        .mockResolvedValueOnce({
          embeddings: [[0.5, 0.6]],
          usage: { inputTokens: 5 },
        }),
    };

    registerEmbeddingProvider("test6", () => mockModel);

    const result = await embedMany({
      model: "test6/test-model",
      texts: ["a", "b", "c"],
    });

    expect(result.embeddings).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
      [0.5, 0.6],
    ]);
    expect(mockModel.embed).toHaveBeenCalledTimes(2);
  });

  it("should limit concurrency", async () => {
    let concurrentCalls = 0;
    let maxConcurrent = 0;

    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test7",
      modelId: "test-model",
      maxEmbeddingsPerCall: 1,
      embed: vi.fn().mockImplementation(async ({ values }: { values: string[] }) => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrentCalls--;
        return {
          embeddings: values.map(() => [0.1, 0.2]),
          usage: { inputTokens: values.length },
        };
      }),
    };

    registerEmbeddingProvider("test7", () => mockModel);

    await embedMany({
      model: "test7/test-model",
      texts: ["a", "b", "c", "d", "e"],
      concurrency: 2,
    });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("should retry failed batches", async () => {
    let attempts = 0;
    const mockModel: EmbeddingModel = {
      spec: "1.0",
      provider: "test8",
      modelId: "test-model",
      embed: vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("API error");
        }
        return {
          embeddings: [[0.1, 0.2]],
          usage: { inputTokens: 5 },
        };
      }),
    };

    registerEmbeddingProvider("test8", () => mockModel);

    const result = await embedMany({
      model: "test8/test-model",
      texts: ["hello"],
      retries: 2,
    });

    expect(result.embeddings).toEqual([[0.1, 0.2]]);
    expect(attempts).toBe(2);
  });
});
