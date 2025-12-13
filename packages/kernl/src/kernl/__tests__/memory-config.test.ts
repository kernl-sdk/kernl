import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LanguageModel, EmbeddingModel } from "@kernl-sdk/protocol";
import type { SearchIndex } from "@kernl-sdk/retrieval";

import { Kernl } from "../kernl";
import { Agent } from "@/agent";
import { logger } from "@/lib/logger";

function createMockLanguageModel(): LanguageModel {
  return {
    spec: "1.0" as const,
    provider: "test",
    modelId: "test-model",
  } as unknown as LanguageModel;
}

function createMockEmbeddingModel(): EmbeddingModel<string> {
  return {
    provider: "test",
    modelId: "test-embedder",
    embed: vi.fn(async ({ values }: { values: string[] }) => ({
      embeddings: values.map((v) => [v.length, 0, 0]),
    })),
  } as unknown as EmbeddingModel<string>;
}

function createMockVectorIndex(): SearchIndex {
  return {
    id: "mock",
    capabilities: () => ({
      namespacing: false,
      filtering: { basic: true },
      hybrid: false,
    }),
    createIndex: vi.fn(),
    deleteIndex: vi.fn(),
    upsert: vi.fn(),
    query: vi.fn(),
    delete: vi.fn(),
  } as unknown as SearchIndex;
}

describe("Kernl memory config warnings", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns when agent enables memory but no embedding configured", () => {
    const kernl = new Kernl({
      storage: {
        vector: createMockVectorIndex(),
      },
      // no memory.embedding
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    kernl.register(agent);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Embeddings are not configured"),
    );
  });

  it("warns when agent enables memory but no vector storage configured", () => {
    const kernl = new Kernl({
      memory: {
        embedding: createMockEmbeddingModel(),
      },
      // no storage.vector
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    kernl.register(agent);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No vector storage configured"),
    );
  });

  it("warns for both missing embedding and vector storage", () => {
    const kernl = new Kernl({});

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    kernl.register(agent);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Embeddings are not configured"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No vector storage configured"),
    );
  });

  it("warns only once across multiple agents", () => {
    const kernl = new Kernl({});

    const agent1 = new Agent({
      id: "agent-1",
      name: "Agent 1",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    const agent2 = new Agent({
      id: "agent-2",
      name: "Agent 2",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    kernl.register(agent1);
    kernl.register(agent2);

    // Should only warn twice total (once for embedding, once for vector)
    // not four times (twice per agent)
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("does not warn when memory config is complete", () => {
    const kernl = new Kernl({
      storage: {
        vector: createMockVectorIndex(),
      },
      memory: {
        embedding: createMockEmbeddingModel(),
      },
    });

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: true },
    });

    kernl.register(agent);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when agent does not enable memory", () => {
    const kernl = new Kernl({});

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      memory: { enabled: false },
    });

    kernl.register(agent);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when agent has no memory config", () => {
    const kernl = new Kernl({});

    const agent = new Agent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "test",
      model: createMockLanguageModel(),
      // no memory config at all
    });

    kernl.register(agent);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
