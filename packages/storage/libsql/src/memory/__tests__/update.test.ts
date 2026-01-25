import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import { create_client, create_storage, testid } from "../../__tests__/helpers";
import { LibSQLStorage } from "../../storage";

describe("LibSQLMemoryStore update", () => {
  let client: Client;
  let storage: LibSQLStorage;
  let memId: string;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    await storage.memories.list(); // init

    memId = testid("mem");
    await storage.memories.create({
      id: memId,
      scope: { namespace: "default", entityId: "user-1" },
      kind: "semantic",
      collection: "facts",
      content: { text: "Original content" },
      wmem: false,
      metadata: { version: 1 },
    });
  });

  afterEach(() => {
    client.close();
  });

  it("updates content and bumps updated_at", async () => {
    const before = await storage.memories.get(memId);
    const originalUpdatedAt = before!.updatedAt;

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10));

    const updated = await storage.memories.update(memId, {
      id: memId,
      content: { text: "Updated content" },
    });

    expect(updated.content).toEqual({ text: "Updated content" });
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);

    // Verify persisted
    const found = await storage.memories.get(memId);
    expect(found?.content).toEqual({ text: "Updated content" });
  });

  it("updates wmem flag", async () => {
    const updated = await storage.memories.update(memId, {
      id: memId,
      wmem: true,
    });

    expect(updated.wmem).toBe(true);

    const found = await storage.memories.get(memId);
    expect(found?.wmem).toBe(true);
  });

  it("updates smem expiration", async () => {
    const expiresAt = Date.now() + 7200000;

    const updated = await storage.memories.update(memId, {
      id: memId,
      smem: { expiresAt },
    });

    expect(updated.smem.expiresAt).toBe(expiresAt);

    const found = await storage.memories.get(memId);
    expect(found?.smem.expiresAt).toBe(expiresAt);
  });

  it("clears smem expiration", async () => {
    // First set an expiration
    await storage.memories.update(memId, {
      id: memId,
      smem: { expiresAt: Date.now() + 3600000 },
    });

    // Then clear it
    const updated = await storage.memories.update(memId, {
      id: memId,
      smem: { expiresAt: null },
    });

    expect(updated.smem.expiresAt).toBeNull();
  });

  it("updates metadata", async () => {
    const newMetadata = { version: 2, source: "api", edited: true };

    const updated = await storage.memories.update(memId, {
      id: memId,
      metadata: newMetadata,
    });

    expect(updated.metadata).toEqual(newMetadata);

    const found = await storage.memories.get(memId);
    expect(found?.metadata).toEqual(newMetadata);
  });

  it("updates multiple fields at once", async () => {
    const updated = await storage.memories.update(memId, {
      id: memId,
      content: { text: "New content" },
      wmem: true,
      metadata: { version: 3 },
    });

    expect(updated.content).toEqual({ text: "New content" });
    expect(updated.wmem).toBe(true);
    expect(updated.metadata).toEqual({ version: 3 });
  });

  it("throws when memory does not exist", async () => {
    await expect(
      storage.memories.update("nonexistent", {
        id: "nonexistent",
        content: { text: "test" },
      }),
    ).rejects.toThrow(/not found/i);
  });

  it("preserves unchanged fields", async () => {
    const before = await storage.memories.get(memId);

    await storage.memories.update(memId, {
      id: memId,
      wmem: true,
    });

    const after = await storage.memories.get(memId);

    // Content should be unchanged
    expect(after?.content).toEqual(before?.content);
    expect(after?.kind).toBe(before?.kind);
    expect(after?.collection).toBe(before?.collection);
    // wmem should be updated
    expect(after?.wmem).toBe(true);
  });
});
