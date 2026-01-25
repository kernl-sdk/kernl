import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Client } from "@libsql/client";

import { create_client, create_storage, testid } from "../../__tests__/helpers";
import { LibSQLStorage } from "../../storage";

describe("LibSQLMemoryStore list", () => {
  let client: Client;
  let storage: LibSQLStorage;

  beforeEach(async () => {
    client = create_client();
    storage = create_storage(client);
    await storage.memories.list(); // init

    // Seed test data
    const now = Date.now();
    await storage.memories.create({
      id: "m1",
      scope: { namespace: "ns1", entityId: "user-1", agentId: "agent-1" },
      kind: "semantic",
      collection: "facts",
      content: { text: "Fact 1" },
      wmem: true,
      timestamp: now,
    });
    await storage.memories.create({
      id: "m2",
      scope: { namespace: "ns1", entityId: "user-1", agentId: "agent-1" },
      kind: "semantic",
      collection: "preferences",
      content: { text: "Preference 1" },
      wmem: false,
      smem: { expiresAt: now + 3600000 },
      timestamp: now + 100,
    });
    await storage.memories.create({
      id: "m3",
      scope: { namespace: "ns1", entityId: "user-2", agentId: "agent-1" },
      kind: "episodic",
      collection: "facts",
      content: { text: "Fact 2" },
      wmem: true,
      timestamp: now + 200,
    });
    await storage.memories.create({
      id: "m4",
      scope: { namespace: "ns2", entityId: "user-1", agentId: "agent-2" },
      kind: "semantic",
      collection: "facts",
      content: { text: "Fact 3" },
      timestamp: now + 300,
    });
  });

  afterEach(() => {
    client.close();
  });

  it("lists all memories without filter", async () => {
    const memories = await storage.memories.list();
    expect(memories.length).toBe(4);
  });

  it("filters by namespace", async () => {
    const memories = await storage.memories.list({
      filter: { scope: { namespace: "ns1" } },
    });
    expect(memories.length).toBe(3);
    expect(memories.every((m) => m.scope.namespace === "ns1")).toBe(true);
  });

  it("filters by entityId", async () => {
    const memories = await storage.memories.list({
      filter: { scope: { entityId: "user-1" } },
    });
    expect(memories.length).toBe(3);
    expect(memories.every((m) => m.scope.entityId === "user-1")).toBe(true);
  });

  it("filters by agentId", async () => {
    const memories = await storage.memories.list({
      filter: { scope: { agentId: "agent-1" } },
    });
    expect(memories.length).toBe(3);
  });

  it("filters by multiple scope fields", async () => {
    const memories = await storage.memories.list({
      filter: {
        scope: { namespace: "ns1", entityId: "user-1" },
      },
    });
    expect(memories.length).toBe(2);
  });

  it("filters by collection", async () => {
    const memories = await storage.memories.list({
      filter: { collections: ["facts"] },
    });
    expect(memories.length).toBe(3);
    expect(memories.every((m) => m.collection === "facts")).toBe(true);
  });

  it("filters by multiple collections", async () => {
    const memories = await storage.memories.list({
      filter: { collections: ["facts", "preferences"] },
    });
    expect(memories.length).toBe(4);
  });

  it("filters by wmem", async () => {
    const wmemTrue = await storage.memories.list({
      filter: { wmem: true },
    });
    expect(wmemTrue.length).toBe(2);
    expect(wmemTrue.every((m) => m.wmem === true)).toBe(true);

    const wmemFalse = await storage.memories.list({
      filter: { wmem: false },
    });
    expect(wmemFalse.length).toBe(2);
  });

  it("filters by smem (has expiration)", async () => {
    const hasSmem = await storage.memories.list({
      filter: { smem: true },
    });
    expect(hasSmem.length).toBe(1);
    expect(hasSmem[0].id).toBe("m2");

    const noSmem = await storage.memories.list({
      filter: { smem: false },
    });
    expect(noSmem.length).toBe(3);
  });

  it("filters by timestamp range", async () => {
    const now = Date.now();
    const m1 = await storage.memories.get("m1");
    const m2 = await storage.memories.get("m2");

    const memories = await storage.memories.list({
      filter: {
        after: m1!.timestamp - 1,
        before: m2!.timestamp + 1,
      },
    });

    expect(memories.length).toBe(2);
    expect(memories.map((m) => m.id).sort()).toEqual(["m1", "m2"]);
  });

  it("orders by timestamp desc (default)", async () => {
    const memories = await storage.memories.list();

    // Should be in desc order by default
    for (let i = 1; i < memories.length; i++) {
      expect(memories[i - 1].timestamp).toBeGreaterThanOrEqual(memories[i].timestamp);
    }
  });

  it("orders by timestamp asc", async () => {
    const memories = await storage.memories.list({ order: "asc" });

    for (let i = 1; i < memories.length; i++) {
      expect(memories[i - 1].timestamp).toBeLessThanOrEqual(memories[i].timestamp);
    }
  });

  it("applies limit", async () => {
    const memories = await storage.memories.list({ limit: 2 });
    expect(memories.length).toBe(2);
  });

  it("applies offset", async () => {
    const all = await storage.memories.list({ order: "asc" });
    const offset = await storage.memories.list({ order: "asc", offset: 2 });

    expect(offset.length).toBe(2);
    expect(offset[0].id).toBe(all[2].id);
  });

  it("combines filters, order, limit, and offset", async () => {
    const memories = await storage.memories.list({
      filter: {
        scope: { namespace: "ns1" },
        collections: ["facts"],
      },
      order: "asc",
      limit: 1,
      offset: 1,
    });

    expect(memories.length).toBe(1);
    expect(memories[0].id).toBe("m3");
  });
});
