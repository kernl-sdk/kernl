import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";

import { PGStorage } from "@/storage";

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;

describe.sequential("PGMemoryStore", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let storage: PGStorage;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    storage = new PGStorage({ pool });

    await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');
    await storage.init();
  });

  afterAll(async () => {
    await storage.close();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE "kernl"."memories" CASCADE');
  });

  describe("create", () => {
    it("should create a memory with text content", async () => {
      const memory = await storage.memories.create({
        id: "mem-1",
        scope: { namespace: "test", entityId: "user-1" },
        kind: "semantic",
        collection: "facts",
        content: { text: "The user likes coffee" },
      });

      expect(memory.id).toBe("mem-1");
      expect(memory.scope.namespace).toBe("test");
      expect(memory.scope.entityId).toBe("user-1");
      expect(memory.collection).toBe("facts");
      expect(memory.content).toEqual({ text: "The user likes coffee" });
      expect(memory.wmem).toBe(false);
      expect(memory.smem.expiresAt).toBeNull();
      expect(memory.createdAt).toBeTypeOf("number");
      expect(memory.updatedAt).toBeTypeOf("number");
    });

    it("should create a memory with object content", async () => {
      const memory = await storage.memories.create({
        id: "mem-2",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "preferences",
        content: {
          object: { theme: "dark", language: "en" },
        },
        metadata: { source: "settings" },
      });

      expect(memory.content).toEqual({
        object: { theme: "dark", language: "en" },
      });
      expect(memory.metadata).toEqual({ source: "settings" });
    });

    it("should create a working memory (wmem=true)", async () => {
      const memory = await storage.memories.create({
        id: "mem-3",
        scope: { namespace: "test" },
        kind: "episodic",
        collection: "working",
        content: { text: "Current task context" },
        wmem: true,
      });

      expect(memory.wmem).toBe(true);
    });

    it("should create a short-term memory with expiration", async () => {
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      const memory = await storage.memories.create({
        id: "mem-4",
        scope: { namespace: "test" },
        kind: "episodic",
        collection: "short-term",
        content: { text: "Temporary information" },
        smem: { expiresAt },
      });

      expect(memory.smem.expiresAt).toBe(expiresAt);
    });
  });

  describe("get", () => {
    it("should get a memory by id", async () => {
      await storage.memories.create({
        id: "mem-get-1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Test memory" },
      });

      const memory = await storage.memories.get("mem-get-1");

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe("mem-get-1");
      expect(memory!.content).toEqual({ text: "Test memory" });
    });

    it("should return null for non-existent memory", async () => {
      const memory = await storage.memories.get("non-existent");
      expect(memory).toBeNull();
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      // seed test data
      await storage.memories.create({
        id: "list-1",
        scope: { namespace: "ns1", entityId: "user-1" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Fact 1" },
        wmem: true,
        timestamp: 1000,
      });
      await storage.memories.create({
        id: "list-2",
        scope: { namespace: "ns1", entityId: "user-1" },
        kind: "semantic",
        collection: "preferences",
        content: { text: "Pref 1" },
        wmem: false,
        timestamp: 2000,
      });
      await storage.memories.create({
        id: "list-3",
        scope: { namespace: "ns2", entityId: "user-2" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Fact 2" },
        wmem: false,
        timestamp: 3000,
      });
    });

    it("should list all memories", async () => {
      const memories = await storage.memories.list();
      expect(memories).toHaveLength(3);
    });

    it("should filter by namespace", async () => {
      const memories = await storage.memories.list({
        filter: { scope: { namespace: "ns1" } },
      });

      expect(memories).toHaveLength(2);
      expect(memories.every((m) => m.scope.namespace === "ns1")).toBe(true);
    });

    it("should filter by entityId", async () => {
      const memories = await storage.memories.list({
        filter: { scope: { entityId: "user-1" } },
      });

      expect(memories).toHaveLength(2);
      expect(memories.every((m) => m.scope.entityId === "user-1")).toBe(true);
    });

    it("should filter by collection", async () => {
      const memories = await storage.memories.list({
        filter: { collections: ["facts"] },
      });

      expect(memories).toHaveLength(2);
      expect(memories.every((m) => m.collection === "facts")).toBe(true);
    });

    it("should filter by wmem", async () => {
      const memories = await storage.memories.list({
        filter: { wmem: true },
      });

      expect(memories).toHaveLength(1);
      expect(memories[0].id).toBe("list-1");
    });

    it("should order by timestamp desc (default)", async () => {
      const memories = await storage.memories.list();

      expect(memories[0].id).toBe("list-3");
      expect(memories[1].id).toBe("list-2");
      expect(memories[2].id).toBe("list-1");
    });

    it("should order by timestamp asc", async () => {
      const memories = await storage.memories.list({ order: "asc" });

      expect(memories[0].id).toBe("list-1");
      expect(memories[1].id).toBe("list-2");
      expect(memories[2].id).toBe("list-3");
    });

    it("should apply limit", async () => {
      const memories = await storage.memories.list({ limit: 2 });
      expect(memories).toHaveLength(2);
    });

    it("should apply offset", async () => {
      const memories = await storage.memories.list({ limit: 2, offset: 1 });

      expect(memories).toHaveLength(2);
      expect(memories[0].id).toBe("list-2");
    });

    it("should filter by timestamp range", async () => {
      const memories = await storage.memories.list({
        filter: { after: 1500, before: 2500 },
      });

      expect(memories).toHaveLength(1);
      expect(memories[0].id).toBe("list-2");
    });
  });

  describe("update", () => {
    it("should update content", async () => {
      await storage.memories.create({
        id: "update-1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Original" },
      });

      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await storage.memories.update("update-1", {
        content: { text: "Updated" },
      });

      expect(updated.content).toEqual({ text: "Updated" });
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    it("should update wmem flag", async () => {
      await storage.memories.create({
        id: "update-2",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Test" },
        wmem: false,
      });

      const updated = await storage.memories.update("update-2", {
        wmem: true,
      });
      expect(updated.wmem).toBe(true);
    });

    it("should update smem expiration", async () => {
      await storage.memories.create({
        id: "update-3",
        scope: { namespace: "test" },
        kind: "episodic",
        collection: "facts",
        content: { text: "Test" },
      });

      const expiresAt = Date.now() + 7200000;
      const updated = await storage.memories.update("update-3", {
        smem: { expiresAt },
      });

      expect(updated.smem.expiresAt).toBe(expiresAt);
    });

    it("should update metadata", async () => {
      await storage.memories.create({
        id: "update-4",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Test" },
      });

      const updated = await storage.memories.update("update-4", {
        metadata: { updated: true, count: 1 },
      });

      expect(updated.metadata).toEqual({ updated: true, count: 1 });
    });

    it("should throw for non-existent memory", async () => {
      await expect(
        storage.memories.update("non-existent", { wmem: true }),
      ).rejects.toThrow("memory not found");
    });
  });

  describe("delete", () => {
    it("should delete a memory", async () => {
      await storage.memories.create({
        id: "delete-1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "To be deleted" },
      });

      await storage.memories.delete("delete-1");

      const memory = await storage.memories.get("delete-1");
      expect(memory).toBeNull();
    });

    it("should not throw for non-existent memory", async () => {
      await expect(storage.memories.delete("non-existent")).resolves.not.toThrow();
    });
  });

  describe("mdelete", () => {
    it("should delete multiple memories", async () => {
      await storage.memories.create({
        id: "mdelete-1",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Memory 1" },
      });
      await storage.memories.create({
        id: "mdelete-2",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Memory 2" },
      });
      await storage.memories.create({
        id: "mdelete-3",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "facts",
        content: { text: "Memory 3" },
      });

      await storage.memories.mdelete(["mdelete-1", "mdelete-2"]);

      const remaining = await storage.memories.list();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("mdelete-3");
    });

    it("should handle empty array", async () => {
      await expect(storage.memories.mdelete([])).resolves.not.toThrow();
    });
  });

  describe("smem filter", () => {
    beforeEach(async () => {
      const now = Date.now();

      // active short-term memory
      await storage.memories.create({
        id: "smem-active",
        scope: { namespace: "test" },
        kind: "episodic",
        collection: "short-term",
        content: { text: "Active" },
        smem: { expiresAt: now + 3600000 }, // expires in 1 hour
      });

      // expired short-term memory
      await storage.memories.create({
        id: "smem-expired",
        scope: { namespace: "test" },
        kind: "episodic",
        collection: "short-term",
        content: { text: "Expired" },
        smem: { expiresAt: now - 3600000 }, // expired 1 hour ago
      });

      // long-term memory (no expiration)
      await storage.memories.create({
        id: "lmem",
        scope: { namespace: "test" },
        kind: "semantic",
        collection: "long-term",
        content: { text: "Long term" },
        smem: { expiresAt: null },
      });
    });

    it("should filter for active short-term memories (smem=true)", async () => {
      const memories = await storage.memories.list({
        filter: { smem: true },
      });

      expect(memories).toHaveLength(1);
      expect(memories[0].id).toBe("smem-active");
    });

    it("should filter for non-short-term memories (smem=false)", async () => {
      const memories = await storage.memories.list({
        filter: { smem: false },
      });

      expect(memories).toHaveLength(2);
      const ids = memories.map((m) => m.id);
      expect(ids).toContain("smem-expired");
      expect(ids).toContain("lmem");
    });
  });
});
