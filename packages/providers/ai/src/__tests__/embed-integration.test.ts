import { describe, it, expect } from "vitest";
import { embed, embedMany } from "@kernl-sdk/retrieval";
import { openai } from "../providers/openai";
import { google } from "../providers/google";

// Force module evaluation by referencing exports
void openai;
void google;

// Integration tests for embedding functions with real APIs.
// Skip these in CI if API keys are not available.

describe.skipIf(!process.env.OPENAI_API_KEY)("embed integration (OpenAI)", () => {
  it("should embed single text with OpenAI", async () => {
    const result = await embed({
      model: "openai/text-embedding-3-small",
      text: "The quick brown fox jumps over the lazy dog",
    });

    expect(result.embedding).toBeDefined();
    expect(Array.isArray(result.embedding)).toBe(true);
    expect(result.embedding.length).toBe(1536); // text-embedding-3-small dimensions
    expect(result.embedding[0]).toBeTypeOf("number");
  });

  it("should embed multiple texts with OpenAI", async () => {
    const result = await embedMany({
      model: "openai/text-embedding-3-small",
      texts: [
        "Hello world",
        "Machine learning is fascinating",
        "TypeScript is great",
      ],
    });

    expect(result.embeddings).toBeDefined();
    expect(result.embeddings.length).toBe(3);
    expect(result.embeddings[0].length).toBe(1536);
    expect(result.embeddings[1].length).toBe(1536);
    expect(result.embeddings[2].length).toBe(1536);
  });

  it("should handle concurrency with OpenAI", async () => {
    const texts = Array.from({ length: 10 }, (_, i) => `Text number ${i}`);

    const result = await embedMany({
      model: "openai/text-embedding-3-small",
      texts,
      concurrency: 3,
    });

    expect(result.embeddings.length).toBe(10);
    result.embeddings.forEach((embedding) => {
      expect(embedding.length).toBe(1536);
    });
  });

  it("should retry on failure", async () => {
    // This test might be flaky, but demonstrates retry behavior
    const result = await embed({
      model: "openai/text-embedding-3-small",
      text: "Test retry behavior",
      retries: 2,
    });

    expect(result.embedding).toBeDefined();
    expect(result.embedding.length).toBe(1536);
  });
});

describe.skipIf(!process.env.GOOGLE_GENERATIVE_AI_API_KEY)(
  "embed integration (Google)",
  () => {
    it("should embed single text with Google", async () => {
      const result = await embed({
        model: "google/text-embedding-004",
        text: "The quick brown fox jumps over the lazy dog",
      });

      expect(result.embedding).toBeDefined();
      expect(Array.isArray(result.embedding)).toBe(true);
      expect(result.embedding.length).toBeGreaterThan(0);
      expect(result.embedding[0]).toBeTypeOf("number");
    });
  },
);
