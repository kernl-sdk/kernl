import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import { create_client, create_storage, testid } from "../../__tests__/helpers";
import { LibSQLStorage } from "../../storage";

describe("LibSQLMemoryStore create/get", () => {
  let client: Client;
  let storage: LibSQLStorage;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    await storage.memories.list(); // init
  });

  afterEach(() => {
    client.close();
  });

  it("creates and reads text memory", async () => {
    const id = testid("mem");

    const created = await storage.memories.create({
      id,
      scope: { namespace: "default", entityId: "user-1", agentId: "agent-1" },
      kind: "semantic",
      collection: "facts",
      content: { text: "User prefers dark mode" },
    });

    expect(created.id).toBe(id);
    expect(created.content).toEqual({ text: "User prefers dark mode" });
    expect(created.kind).toBe("semantic");

    const found = await storage.memories.get(id);
    expect(found).not.toBeNull();
    expect(found?.content).toEqual({ text: "User prefers dark mode" });
    expect(found?.scope.namespace).toBe("default");
    expect(found?.scope.entityId).toBe("user-1");
  });

  it("creates and reads object memory", async () => {
    const id = testid("mem");
    const objectContent = {
      object: {
        preferences: {
          theme: "dark",
          language: "en",
          notifications: true,
        },
      },
    };

    const created = await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "semantic",
      content: objectContent,
    });

    expect(created.content).toEqual(objectContent);

    const found = await storage.memories.get(id);
    expect(found?.content).toEqual(objectContent);
  });

  it("creates working memory (wmem=true)", async () => {
    const id = testid("mem");

    const created = await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "episodic",
      content: { text: "Current task context" },
      wmem: true,
    });

    expect(created.wmem).toBe(true);

    const found = await storage.memories.get(id);
    expect(found?.wmem).toBe(true);
  });

  it("creates short-term memory with expiration", async () => {
    const id = testid("mem");
    const expiresAt = Date.now() + 3600000; // 1 hour from now

    const created = await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "episodic",
      content: { text: "Temporary note" },
      smem: { expiresAt },
    });

    expect(created.smem.expiresAt).toBe(expiresAt);

    const found = await storage.memories.get(id);
    expect(found?.smem.expiresAt).toBe(expiresAt);
  });

  it("gets by id and returns null when missing", async () => {
    const found = await storage.memories.get("nonexistent");
    expect(found).toBeNull();
  });

  it("handles null scope fields", async () => {
    const id = testid("mem");

    const created = await storage.memories.create({
      id,
      scope: {}, // All scope fields null
      kind: "semantic",
      content: { text: "Global memory" },
    });

    expect(created.scope.namespace).toBeUndefined();
    expect(created.scope.entityId).toBeUndefined();
    expect(created.scope.agentId).toBeUndefined();

    const found = await storage.memories.get(id);
    expect(found?.scope.namespace).toBeUndefined();
  });

  it("stores and retrieves metadata", async () => {
    const id = testid("mem");
    const metadata = { confidence: 0.95, source: "user_input", version: 2 };

    const created = await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "Test" },
      metadata,
    });

    expect(created.metadata).toEqual(metadata);

    const found = await storage.memories.get(id);
    expect(found?.metadata).toEqual(metadata);
  });

  it("sets timestamps on create", async () => {
    const before = Date.now();

    const created = await storage.memories.create({
      id: testid("mem"),
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "Test" },
    });

    const after = Date.now();

    expect(created.timestamp).toBeGreaterThanOrEqual(before);
    expect(created.timestamp).toBeLessThanOrEqual(after);
    expect(created.createdAt).toBeGreaterThanOrEqual(before);
    expect(created.updatedAt).toBeGreaterThanOrEqual(before);
  });
});
