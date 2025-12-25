import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import { Kernl, Agent } from "kernl";
import type { LanguageModel } from "@kernl-sdk/protocol";
import type { SearchHit } from "@kernl-sdk/retrieval";
import "@kernl-sdk/ai/openai"; // Register OpenAI embedding provider

import { postgres, pgvector } from "../index";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;

describe.sequential(
  "Memory Integration with PGVector",
  { timeout: 30000 },
  () => {
    if (!TEST_DB_URL) {
      it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      it.skip("requires OPENAI_API_KEY environment variable", () => {});
      return;
    }

    let pool: Pool;
    let kernl: Kernl;

    beforeAll(async () => {
      pool = new Pool({ connectionString: TEST_DB_URL });

      // Clean slate
      await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');

      // Create Kernl with PG + pgvector
      kernl = new Kernl({
        storage: {
          db: postgres({ pool }),
          vector: pgvector({ pool }),
        },
        memory: {
          embedding: "openai/text-embedding-3-small",
          dimensions: 1536,
        },
      });

      // Register a dummy agent for test scope
      const model = {
        spec: "1.0" as const,
        provider: "test",
        modelId: "test-model",
      } as unknown as LanguageModel;

      const agent = new Agent({
        id: "test-agent",
        name: "Test Agent",
        instructions: () => "test instructions",
        model,
      });

      kernl.register(agent);

      // Initialize storage (creates "kernl" schema and tables)
      await kernl.storage.init();
    });

    afterAll(async () => {
      if (kernl) {
        await kernl.storage.close();
      }
    });

    beforeEach(async () => {
      // Clean memories between tests
      await pool.query('DELETE FROM "kernl"."memories"');

      // Vector index table may not exist yet (created lazily on first memory operation)
      try {
        await pool.query('DELETE FROM "kernl"."memories_sindex"');
      } catch (err: any) {
        if (!err.message?.includes("does not exist")) {
          throw err;
        }
      }
    });

    it("creates memory and indexes it in pgvector on first operation", async () => {
      const memory = await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test", agentId: "test-agent" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user loves TypeScript programming" },
      });

      expect(memory.id).toBe("m1");
      expect(memory.content.text).toBe("The user loves TypeScript programming");

      // Verify memory exists in DB
      const dbResult = await pool.query(
        'SELECT * FROM "kernl"."memories" WHERE id = $1',
        ["m1"],
      );
      expect(dbResult.rows).toHaveLength(1);

      // Verify memory was indexed in pgvector
      const vectorResult = await pool.query(
        'SELECT * FROM "kernl"."memories_sindex" WHERE id = $1',
        ["m1"],
      );
      expect(vectorResult.rows).toHaveLength(1);
      expect(vectorResult.rows[0].text).toBe(
        "The user loves TypeScript programming",
      );
      expect(vectorResult.rows[0].tvec).toBeTruthy(); // vector embedding exists
    });

    it("searches memories using vector similarity", async () => {
      // Create several memories
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user loves TypeScript programming" },
      });

      await kernl.memories.create({
        id: "m2",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user enjoys cooking Italian food" },
      });

      await kernl.memories.create({
        id: "m3",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "TypeScript has excellent type safety" },
      });

      // Search for TypeScript-related memories
      const results = await kernl.memories.search({
        query: "programming languages",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);

      // Should find TypeScript-related memories with higher scores
      const ids = results.map((r: SearchHit) => r.document?.id);
      expect(ids).toContain("m1"); // Direct match
      expect(ids).toContain("m3"); // Related to TypeScript
    });

    it("returns no results when filters exclude all matches", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "ns1", agentId: "test-agent" },
        kind: "semantic",
        collection: "facts",
        content: { text: "User likes hiking" },
      });

      // Filter for a different namespace that has no memories
      const results = await kernl.memories.search({
        query: "hiking",
        filter: { scope: { namespace: "ns2" } },
        limit: 10,
      });

      expect(results.length).toBe(0);
    });

    it("filters search results by scope", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "user1", agentId: "test-agent" },
        kind: "semantic",
        collection: "facts",
        content: { text: "User 1 likes cats" },
      });

      await kernl.memories.create({
        id: "m2",
        scope: { namespace: "user2", agentId: "test-agent" },
        kind: "semantic",
        collection: "facts",
        content: { text: "User 2 likes cats" },
      });

      // Search only in user1 namespace
      const results = await kernl.memories.search({
        query: "cats",
        filter: { scope: { namespace: "user1" } },
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].document?.id).toBe("m1");
    });

    it("respects limit", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user likes TypeScript" },
      });

      await kernl.memories.create({
        id: "m2",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user likes JavaScript" },
      });

      await kernl.memories.create({
        id: "m3",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user likes Rust" },
      });

      const results = await kernl.memories.search({
        query: "programming languages",
        limit: 1,
      });

      expect(results.length).toBe(1);
    });

    it("handles index creation idempotently across Kernl instances", async () => {
      // Create memory with first Kernl instance
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "First instance memory" },
      });

      // Close first instance (also closes the pool)
      await kernl.storage.close();

      // Create new pool and Kernl instance - reassign both so afterAll and beforeEach work
      pool = new Pool({ connectionString: TEST_DB_URL });
      kernl = new Kernl({
        storage: {
          db: postgres({ pool }),
          vector: pgvector({ pool }),
        },
        memory: {
          embedding: "openai/text-embedding-3-small",
          dimensions: 1536,
        },
      });

      // Should be able to search without errors (index already exists)
      const results = await kernl.memories.search({
        query: "memory",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document?.id).toBe("m1");
    });

    it("updates memory content and re-indexes", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Original content about dogs" },
      });

      // Update content
      await kernl.memories.update({
        id: "m1",
        content: { text: "Updated content about cats" },
      });

      // Search should find updated content
      const results = await kernl.memories.search({
        query: "cats",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r: SearchHit) => r.document?.id === "m1");
      expect(match).toBeDefined();
      expect(match?.document?.text).toBe("Updated content about cats");
    });

    it("patches memory metadata without re-indexing", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Cats are great pets" },
        metadata: { version: 1 },
      });

      // Update only metadata (should patch, not full re-index)
      await kernl.memories.update({
        id: "m1",
        metadata: { version: 2, updated: true },
      });

      // Verify metadata updated in primary DB (metadata is not indexed)
      const dbResult = await pool.query(
        'SELECT metadata FROM "kernl"."memories" WHERE id = $1',
        ["m1"],
      );

      expect(dbResult.rows[0].metadata).toEqual({
        version: 2,
        updated: true,
      });
    });

    it("isolates memories by agentId", async () => {
      // Register two agents
      const model = {
        spec: "1.0" as const,
        provider: "test",
        modelId: "test-model",
      } as unknown as LanguageModel;

      const agent1 = new Agent({
        id: "test-agent-1",
        name: "Test Agent 1",
        instructions: () => "test instructions",
        model,
      });
      const agent2 = new Agent({
        id: "test-agent-2",
        name: "Test Agent 2",
        instructions: () => "test instructions",
        model,
      });
      kernl.register(agent1);
      kernl.register(agent2);

      // Create memories for each agent in the same namespace
      await agent1.memories.create({
        namespace: "shared-ns",
        collection: "facts",
        content: { text: "Agent 1 knows about cats" },
      });

      await agent2.memories.create({
        namespace: "shared-ns",
        collection: "facts",
        content: { text: "Agent 2 knows about cats" },
      });

      // Search from agent1 - should only see agent1's memory
      const results1 = await agent1.memories.search({
        query: "cats",
        filter: { scope: { namespace: "shared-ns" } },
        limit: 10,
      });

      // Search from agent2 - should only see agent2's memory
      const results2 = await agent2.memories.search({
        query: "cats",
        filter: { scope: { namespace: "shared-ns" } },
        limit: 10,
      });

      expect(results1).toHaveLength(1);
      expect(results1[0].document?.agentId).toBe("test-agent-1");

      expect(results2).toHaveLength(1);
      expect(results2[0].document?.agentId).toBe("test-agent-2");
    });

    it("creates memories with multimodal content", async () => {
      await kernl.memories.create({
        id: "m1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "media",
        content: {
          text: "A beautiful sunset",
          image: {
            data: "base64encodedimage",
            mime: "image/png",
            alt: "Sunset over the ocean",
          },
        },
      });

      // Should be searchable by text
      const results = await kernl.memories.search({
        query: "sunset",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r: SearchHit) => r.document?.id === "m1");
      expect(match).toBeDefined();
    });
  },
);
