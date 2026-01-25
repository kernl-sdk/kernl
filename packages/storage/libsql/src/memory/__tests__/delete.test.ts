import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import { create_client, create_storage, testid } from "../../__tests__/helpers";
import { LibSQLStorage } from "../../storage";

describe("LibSQLMemoryStore delete", () => {
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

  it("deletes by id", async () => {
    const id = testid("mem");

    await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "To be deleted" },
    });

    // Verify exists
    const before = await storage.memories.get(id);
    expect(before).not.toBeNull();

    // Delete
    await storage.memories.delete(id);

    // Verify gone
    const after = await storage.memories.get(id);
    expect(after).toBeNull();
  });

  it("delete is idempotent (no error for missing)", async () => {
    // Should not throw
    await storage.memories.delete("nonexistent");
  });

  it("mdelete removes multiple ids", async () => {
    const ids = [testid("m1"), testid("m2"), testid("m3")];

    // Create memories
    for (const id of ids) {
      await storage.memories.create({
        id,
        scope: { namespace: "default" },
        kind: "semantic",
        content: { text: `Memory ${id}` },
      });
    }

    // Verify all exist
    for (const id of ids) {
      expect(await storage.memories.get(id)).not.toBeNull();
    }

    // Delete all
    await storage.memories.mdelete(ids);

    // Verify all gone
    for (const id of ids) {
      expect(await storage.memories.get(id)).toBeNull();
    }
  });

  it("mdelete handles partial matches", async () => {
    const existing = testid("existing");

    await storage.memories.create({
      id: existing,
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "Exists" },
    });

    // Delete mix of existing and non-existing
    await storage.memories.mdelete([existing, "nonexistent-1", "nonexistent-2"]);

    // Existing should be deleted
    expect(await storage.memories.get(existing)).toBeNull();
  });

  it("mdelete handles empty array", async () => {
    // Create a memory to ensure it's not affected
    const id = testid("mem");
    await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "Should remain" },
    });

    // Should not throw and not affect anything
    await storage.memories.mdelete([]);

    // Memory should still exist
    const found = await storage.memories.get(id);
    expect(found).not.toBeNull();
  });

  it("mdelete with single id", async () => {
    const id = testid("mem");

    await storage.memories.create({
      id,
      scope: { namespace: "default" },
      kind: "semantic",
      content: { text: "Single" },
    });

    await storage.memories.mdelete([id]);

    expect(await storage.memories.get(id)).toBeNull();
  });
});
