import { describe, it, expect, vi } from "vitest";
import type { EmbeddingModel } from "@kernl-sdk/protocol";

import { MemoryByteEncoder, ObjectTextCodec } from "../encoder";
import type { MemoryByte } from "../types";

// Mock embedder that returns predictable vectors
function createMockEmbedder(): EmbeddingModel<string> {
  return {
    provider: "test",
    modelId: "test-embedder",
    embed: vi.fn(async ({ values }: { values: string[] }) => ({
      embeddings: values.map((v) => [v.length, 0, 0]), // simple: [length, 0, 0]
    })),
  } as unknown as EmbeddingModel<string>;
}

describe("ObjectTextCodec", () => {
  it("encodes simple object to YAML", () => {
    const obj = { name: "Tony", preference: "coffee" };
    const result = ObjectTextCodec.encode(obj);

    expect(result).toContain("name: Tony");
    expect(result).toContain("preference: coffee");
  });

  it("sorts keys for determinism", () => {
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, m: 3, z: 1 };

    expect(ObjectTextCodec.encode(obj1)).toBe(ObjectTextCodec.encode(obj2));
  });

  it("truncates long objects with ellipsis", () => {
    const longValue = "x".repeat(4000);
    const obj = { data: longValue };
    const result = ObjectTextCodec.encode(obj);

    expect(result.length).toBeLessThanOrEqual(3005); // 3000 + "\n..."
    expect(result.endsWith("\n...")).toBe(true);
  });

  it("handles nested objects", () => {
    const obj = {
      user: {
        name: "Tony",
        prefs: { coffee: { shots: 2 } },
      },
    };
    const result = ObjectTextCodec.encode(obj);

    expect(result).toContain("user:");
    expect(result).toContain("name: Tony");
    expect(result).toContain("shots: 2");
  });

  it("handles arrays", () => {
    const obj = { items: ["a", "b", "c"] };
    const result = ObjectTextCodec.encode(obj);

    expect(result).toContain("items:");
    expect(result).toContain("- a");
  });
});

describe("MemoryByteEncoder", () => {
  describe("encode", () => {
    it("encodes text-only content", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const byte: MemoryByte = { text: "Hello world" };
      const result = await encoder.encode(byte);

      expect(result.text).toBe("Hello world");
      expect(result.objtext).toBeUndefined();
      expect(result.tvec).toBeDefined();
      expect(embedder.embed).toHaveBeenCalledWith({ values: ["Hello world"] });
    });

    it("encodes object-only content with projection", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const byte: MemoryByte = {
        object: { preference: "coffee", shots: 2 },
      };
      const result = await encoder.encode(byte);

      // text falls back to objtext projection
      expect(result.text).toContain("preference: coffee");
      expect(result.objtext).toContain("preference: coffee");
      expect(result.tvec).toBeDefined();
    });

    it("combines text and object for embedding", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const byte: MemoryByte = {
        text: "Tony likes coffee",
        object: { shots: 2, sugar: false },
      };
      const result = await encoder.encode(byte);

      expect(result.text).toBe("Tony likes coffee");
      expect(result.objtext).toContain("shots: 2");

      // embedding should be called with combined text
      const embedCall = (embedder.embed as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(embedCall.values[0]).toContain("Tony likes coffee");
      expect(embedCall.values[0]).toContain("shots: 2");
    });

    it("does not include metadata (lives in primary DB only)", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const byte: MemoryByte = {
        text: "test",
        object: { key: "value" },
      };
      const result = await encoder.encode(byte);

      // metadata is not part of IndexableByte - it stays in the primary DB
      expect("metadata" in result).toBe(false);
    });

    it("returns undefined tvec when no content", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const byte: MemoryByte = {};
      const result = await encoder.encode(byte);

      expect(result.text).toBeUndefined();
      expect(result.objtext).toBeUndefined();
      expect(result.tvec).toBeUndefined();
      expect(embedder.embed).not.toHaveBeenCalled();
    });
  });

  describe("embed", () => {
    it("exposes embed method for query embedding", async () => {
      const embedder = createMockEmbedder();
      const encoder = new MemoryByteEncoder(embedder);

      const vec = await encoder.embed("search query");

      expect(vec).toEqual([12, 0, 0]); // "search query".length = 12
    });
  });
});
