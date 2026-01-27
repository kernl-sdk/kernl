import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import { Kernl, Agent } from "kernl";
import type { LanguageModel } from "@kernl-sdk/protocol";
import "@kernl-sdk/ai/openai"; // Register OpenAI embedding provider

import { postgres } from "@kernl-sdk/pg";
import { turbopuffer } from "../../index";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;
const TURBOPUFFER_API_KEY = process.env.TURBOPUFFER_API_KEY;
const TURBOPUFFER_REGION = process.env.TURBOPUFFER_REGION ?? "api";

describe.sequential(
  "Memory Integration with Turbopuffer",
  { timeout: 60000 },
  () => {
    if (!TEST_DB_URL) {
      it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
      return;
    }

    if (!TURBOPUFFER_API_KEY) {
      it.skip("requires TURBOPUFFER_API_KEY environment variable", () => {});
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      it.skip("requires OPENAI_API_KEY environment variable", () => {});
      return;
    }

    let pool: Pool;
    let kernl: Kernl;
    let agent: Agent;
    const vectorIndexId = `kernl-test-memories-${Date.now()}`;

    // Unique ID generator to avoid stale data between tests
    let testCounter = 0;
    const uid = (base: string) => `${base}-${Date.now()}-${++testCounter}`;

    beforeAll(async () => {
      pool = new Pool({ connectionString: TEST_DB_URL });

      // Clean slate for postgres
      await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');

      // Create Kernl with PG for relational + Turbopuffer for vector
      kernl = new Kernl({
        storage: {
          db: postgres({ pool }),
          vector: turbopuffer({
            apiKey: TURBOPUFFER_API_KEY,
            region: TURBOPUFFER_REGION,
          }),
        },
        memory: {
          embedding: "openai/text-embedding-3-small",
          dimensions: 1536,
          indexId: vectorIndexId,
        },
      });

      // Register a dummy agent for test scope
      const model = {
        spec: "1.0" as const,
        provider: "test",
        modelId: "test-model",
      } as unknown as LanguageModel;

      agent = new Agent({
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
      // Clean up Turbopuffer namespace
      try {
        const tpuf = turbopuffer({
          apiKey: TURBOPUFFER_API_KEY!,
          region: TURBOPUFFER_REGION,
        });
        await tpuf.deleteIndex(vectorIndexId);
      } catch {
        // Ignore if already deleted
      }

      if (kernl) {
        await kernl.storage.close();
      }
    });

    beforeEach(async () => {
      // Clean memories in postgres
      await pool.query('DELETE FROM "kernl"."memories"');

      // Note: We don't delete the Turbopuffer namespace between tests because
      // MemoryIndexHandle caches its init state. The namespace is cleaned up
      // in afterAll. Tests use unique memory IDs so they don't conflict.
    });

    it("creates memory and indexes it in Turbopuffer", async () => {
      const id = uid("m");
      const memory = await agent.memories.create({
        id,
        namespace: "test",
        collection: "facts",
        content: { text: "The user loves TypeScript programming" },
      });

      expect(memory.id).toBe(id);
      expect(memory.content.text).toBe("The user loves TypeScript programming");

      // Verify memory exists in postgres
      const dbResult = await pool.query(
        'SELECT * FROM "kernl"."memories" WHERE id = $1',
        [id],
      );
      expect(dbResult.rows).toHaveLength(1);

      // Verify memory is searchable in Turbopuffer
      const results = await agent.memories.search({
        query: "TypeScript",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].record.id).toBe(id);
    });

    it("searches memories using vector search", async () => {
      // Create several memories with unique IDs
      const id1 = uid("m");
      const id2 = uid("m");
      const id3 = uid("m");

      await agent.memories.create({
        id: id1,
        namespace: "test",
        collection: "facts",
        content: { text: "The user loves TypeScript programming" },
      });

      await agent.memories.create({
        id: id2,
        namespace: "test",
        collection: "facts",
        content: { text: "The user enjoys cooking Italian food" },
      });

      await agent.memories.create({
        id: id3,
        namespace: "test",
        collection: "facts",
        content: { text: "TypeScript has excellent type safety" },
      });

      // Search for TypeScript-related memories (vector-only since hybrid not supported)
      const results = await agent.memories.search({
        query: "programming languages",
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);

      // Should find TypeScript-related memories with higher scores
      const ids = results.map((r) => r.record.id);
      expect(ids).toContain(id1); // Direct match
      expect(ids).toContain(id3); // Related to TypeScript
    });

    it("returns no results when filters exclude all matches", async () => {
      const id = uid("m");
      const ns = uid("ns");

      await agent.memories.create({
        id,
        namespace: ns,
        collection: "facts",
        content: { text: "User likes hiking" },
      });

      // Filter for a different namespace that has no memories
      const results = await agent.memories.search({
        query: "hiking",
        filter: { scope: { namespace: "nonexistent-ns" } },
        limit: 10,
      });

      expect(results.length).toBe(0);
    });

    it("filters search results by scope", async () => {
      const id1 = uid("m");
      const id2 = uid("m");
      const ns1 = uid("user");
      const ns2 = uid("user");

      await agent.memories.create({
        id: id1,
        namespace: ns1,
        collection: "facts",
        content: { text: "User 1 likes cats" },
      });

      await agent.memories.create({
        id: id2,
        namespace: ns2,
        collection: "facts",
        content: { text: "User 2 likes cats" },
      });

      // Search only in ns1 namespace
      const results = await agent.memories.search({
        query: "cats",
        filter: { scope: { namespace: ns1 } },
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].record.id).toBe(id1);
    });

    it("respects limit", async () => {
      const ns = uid("ns");

      await agent.memories.create({
        namespace: ns,
        collection: "facts",
        content: { text: "The user likes TypeScript" },
      });

      await agent.memories.create({
        namespace: ns,
        collection: "facts",
        content: { text: "The user likes JavaScript" },
      });

      await agent.memories.create({
        namespace: ns,
        collection: "facts",
        content: { text: "The user likes Rust" },
      });

      // Filter by namespace to only get our test's memories
      const results = await agent.memories.search({
        query: "programming languages",
        filter: { scope: { namespace: ns } },
        limit: 1,
      });

      expect(results.length).toBe(1);
    });

    it("updates memory content and re-indexes", async () => {
      const id = uid("m");
      const ns = uid("ns");

      await agent.memories.create({
        id,
        namespace: ns,
        collection: "facts",
        content: { text: "Original content about dogs" },
      });

      // Update content (still use kernl.memories for update - not yet on agent API)
      await kernl.memories.update(id, {
        content: { text: "Updated content about cats" },
      });

      // Search should find updated content
      const results = await agent.memories.search({
        query: "cats",
        filter: { scope: { namespace: ns } },
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r) => r.record.id === id);
      expect(match).toBeDefined();
      expect(match?.record.content.text).toBe("Updated content about cats");
    });

    it("creates memories with multimodal content", async () => {
      const id = uid("m");
      const ns = uid("ns");

      await agent.memories.create({
        id,
        namespace: ns,
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
      const results = await agent.memories.search({
        query: "sunset",
        filter: { scope: { namespace: ns } },
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      const match = results.find((r) => r.record.id === id);
      expect(match).toBeDefined();
    });

    it("filters by collection", async () => {
      const id1 = uid("m");
      const id2 = uid("m");
      const ns = uid("ns");

      await agent.memories.create({
        id: id1,
        namespace: ns,
        collection: "facts",
        content: { text: "This is a fact about programming" },
      });

      await agent.memories.create({
        id: id2,
        namespace: ns,
        collection: "preferences",
        content: { text: "User prefers programming in TypeScript" },
      });

      // Filter by collection and namespace
      const results = await agent.memories.search({
        query: "programming",
        filter: { scope: { namespace: ns }, collections: ["facts"] },
        limit: 10,
      });

      expect(results.length).toBe(1);
      expect(results[0].record.id).toBe(id1);
    });

    it("isolates memories by agentId", async () => {
      const ns = uid("ns");

      // Register a second agent
      const model2 = {
        spec: "1.0" as const,
        provider: "test",
        modelId: "test-model",
      } as unknown as LanguageModel;

      const agent2 = new Agent({
        id: "test-agent-2",
        name: "Test Agent 2",
        instructions: () => "test instructions",
        model: model2,
      });
      kernl.register(agent2);

      // Create memories for each agent in the same namespace
      await agent.memories.create({
        namespace: ns,
        collection: "facts",
        content: { text: "Agent 1 knows about cats" },
      });

      await agent2.memories.create({
        namespace: ns,
        collection: "facts",
        content: { text: "Agent 2 knows about cats" },
      });

      // Search from agent1 - should only see agent1's memory
      const results1 = await agent.memories.search({
        query: "cats",
        filter: { scope: { namespace: ns } },
        limit: 10,
      });

      // Search from agent2 - should only see agent2's memory
      const results2 = await agent2.memories.search({
        query: "cats",
        filter: { scope: { namespace: ns } },
        limit: 10,
      });

      expect(results1).toHaveLength(1);
      expect(results1[0].record.scope.agentId).toBe("test-agent");

      expect(results2).toHaveLength(1);
      expect(results2[0].record.scope.agentId).toBe("test-agent-2");
    });
  },
);
