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
        collection: "facts",
        content: { kind: "text", text: "The user likes coffee" },
      });

      expect(memory.id).toBe("mem-1");
      expect(memory.scope.namespace).toBe("test");
      expect(memory.scope.entityId).toBe("user-1");
      expect(memory.collection).toBe("facts");
      expect(memory.content).toEqual({ kind: "text", text: "The user likes coffee" });
      expect(memory.wmem).toBe(false);
      expect(memory.smemExpiresAt).toBeNull();
      expect(memory.createdAt).toBeTypeOf("number");
      expect(memory.updatedAt).toBeTypeOf("number");
    });

    it("should create a memory with object content", async () => {
      const memory = await storage.memories.create({
        id: "mem-2",
        scope: { namespace: "test" },
        collection: "preferences",
        content: {
          kind: "object",
          value: { theme: "dark", language: "en" },
          summary: "User preferences",
        },
        metadata: { source: "settings" },
      });

      expect(memory.content).toEqual({
        kind: "object",
        value: { theme: "dark", language: "en" },
        summary: "User preferences",
      });
      expect(memory.metadata).toEqual({ source: "settings" });
    });

    it("should create a working memory (wmem=true)", async () => {
      const memory = await storage.memories.create({
        id: "mem-3",
        scope: { namespace: "test" },
        collection: "working",
        content: { kind: "text", text: "Current task context" },
        wmem: true,
      });

      expect(memory.wmem).toBe(true);
    });

    it("should create a short-term memory with expiration", async () => {
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      const memory = await storage.memories.create({
        id: "mem-4",
        scope: { namespace: "test" },
        collection: "short-term",
        content: { kind: "text", text: "Temporary information" },
        smemExpiresAt: expiresAt,
      });

      expect(memory.smemExpiresAt).toBe(expiresAt);
    });
  });

  describe("get", () => {
    it("should get a memory by id", async () => {
      await storage.memories.create({
        id: "mem-get-1",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Test memory" },
      });

      const memory = await storage.memories.get("mem-get-1");

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe("mem-get-1");
      expect(memory!.content).toEqual({ kind: "text", text: "Test memory" });
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
        collection: "facts",
        content: { kind: "text", text: "Fact 1" },
        wmem: true,
        timestamp: 1000,
      });
      await storage.memories.create({
        id: "list-2",
        scope: { namespace: "ns1", entityId: "user-1" },
        collection: "preferences",
        content: { kind: "text", text: "Pref 1" },
        wmem: false,
        timestamp: 2000,
      });
      await storage.memories.create({
        id: "list-3",
        scope: { namespace: "ns2", entityId: "user-2" },
        collection: "facts",
        content: { kind: "text", text: "Fact 2" },
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
        collection: "facts",
        content: { kind: "text", text: "Original" },
      });

      const updated = await storage.memories.update("update-1", {
        content: { kind: "text", text: "Updated" },
      });

      expect(updated.content).toEqual({ kind: "text", text: "Updated" });
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    it("should update wmem flag", async () => {
      await storage.memories.create({
        id: "update-2",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Test" },
        wmem: false,
      });

      const updated = await storage.memories.update("update-2", { wmem: true });
      expect(updated.wmem).toBe(true);
    });

    it("should update smemExpiresAt", async () => {
      await storage.memories.create({
        id: "update-3",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Test" },
      });

      const expiresAt = Date.now() + 7200000;
      const updated = await storage.memories.update("update-3", {
        smemExpiresAt: expiresAt,
      });

      expect(updated.smemExpiresAt).toBe(expiresAt);
    });

    it("should update metadata", async () => {
      await storage.memories.create({
        id: "update-4",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Test" },
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
        collection: "facts",
        content: { kind: "text", text: "To be deleted" },
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
        collection: "facts",
        content: { kind: "text", text: "Memory 1" },
      });
      await storage.memories.create({
        id: "mdelete-2",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Memory 2" },
      });
      await storage.memories.create({
        id: "mdelete-3",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text", text: "Memory 3" },
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
        collection: "short-term",
        content: { kind: "text", text: "Active" },
        smemExpiresAt: now + 3600000, // expires in 1 hour
      });

      // expired short-term memory
      await storage.memories.create({
        id: "smem-expired",
        scope: { namespace: "test" },
        collection: "short-term",
        content: { kind: "text", text: "Expired" },
        smemExpiresAt: now - 3600000, // expired 1 hour ago
      });

      // long-term memory (no expiration)
      await storage.memories.create({
        id: "lmem",
        scope: { namespace: "test" },
        collection: "long-term",
        content: { kind: "text", text: "Long term" },
        smemExpiresAt: null,
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
