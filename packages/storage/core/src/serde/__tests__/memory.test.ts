import { describe, it, expect, beforeEach, vi } from "vitest";

import { MemoryRecordCodec, NewMemoryCodec } from "../memory";

describe("NewMemoryCodec", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  describe("encode", () => {
    it("should apply default values", () => {
      const memory = {
        id: "mem-1",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text" as const, text: "Hello world" },
      };

      const record = NewMemoryCodec.encode(memory);

      expect(record.wmem).toBe(false);
      expect(record.smem_expires_at).toBeNull();
      expect(record.metadata).toBeNull();
    });

    it("should preserve provided values", () => {
      const memory = {
        id: "mem-2",
        scope: { namespace: "test", entityId: "user-1", agentId: "agent-1" },
        collection: "preferences",
        content: { kind: "object" as const, value: { key: "value" }, summary: "A preference" },
        wmem: true,
        smemExpiresAt: 1704153600000,
        timestamp: 1704067200000,
        metadata: { source: "user" },
      };

      const record = NewMemoryCodec.encode(memory);

      expect(record.namespace).toBe("test");
      expect(record.entity_id).toBe("user-1");
      expect(record.agent_id).toBe("agent-1");
      expect(record.collection).toBe("preferences");
      expect(record.content).toEqual({ kind: "object", value: { key: "value" }, summary: "A preference" });
      expect(record.wmem).toBe(true);
      expect(record.smem_expires_at).toBe(1704153600000);
      expect(record.timestamp).toBe(1704067200000);
      expect(record.metadata).toEqual({ source: "user" });
    });

    it("should apply current timestamp when not provided", () => {
      const now = Date.now();

      const memory = {
        id: "mem-3",
        scope: { namespace: "test" },
        collection: "facts",
        content: { kind: "text" as const, text: "Test" },
      };

      const record = NewMemoryCodec.encode(memory);

      expect(record.timestamp).toBe(now);
      expect(record.created_at).toBe(now);
      expect(record.updated_at).toBe(now);
    });

    it("should handle null scope fields", () => {
      const memory = {
        id: "mem-4",
        scope: {},
        collection: "facts",
        content: { kind: "text" as const, text: "Test" },
      };

      const record = NewMemoryCodec.encode(memory);

      expect(record.namespace).toBeNull();
      expect(record.entity_id).toBeNull();
      expect(record.agent_id).toBeNull();
    });
  });

  describe("decode", () => {
    it("should decode MemoryDBRecord to NewMemory", () => {
      const record = {
        id: "mem-1",
        namespace: "test",
        entity_id: "user-1",
        agent_id: "agent-1",
        collection: "facts",
        content: { kind: "text" as const, text: "Hello" },
        wmem: true,
        smem_expires_at: 1704153600000,
        timestamp: 1704067200000,
        created_at: 1704067200000,
        updated_at: 1704067200000,
        metadata: { key: "value" },
      };

      const memory = NewMemoryCodec.decode(record);

      expect(memory.id).toBe("mem-1");
      expect(memory.scope.namespace).toBe("test");
      expect(memory.scope.entityId).toBe("user-1");
      expect(memory.scope.agentId).toBe("agent-1");
      expect(memory.collection).toBe("facts");
      expect(memory.content).toEqual({ kind: "text", text: "Hello" });
      expect(memory.wmem).toBe(true);
      expect(memory.smemExpiresAt).toBe(1704153600000);
      expect(memory.timestamp).toBe(1704067200000);
      expect(memory.metadata).toEqual({ key: "value" });
    });

    it("should handle null values", () => {
      const record = {
        id: "mem-2",
        namespace: null,
        entity_id: null,
        agent_id: null,
        collection: "facts",
        content: { kind: "text" as const, text: "Test" },
        wmem: false,
        smem_expires_at: null,
        timestamp: 1704067200000,
        created_at: 1704067200000,
        updated_at: 1704067200000,
        metadata: null,
      };

      const memory = NewMemoryCodec.decode(record);

      expect(memory.scope.namespace).toBeUndefined();
      expect(memory.scope.entityId).toBeUndefined();
      expect(memory.scope.agentId).toBeUndefined();
      expect(memory.smemExpiresAt).toBeNull();
      expect(memory.metadata).toBeNull();
    });
  });
});

describe("MemoryRecordCodec", () => {
  describe("encode", () => {
    it("should encode MemoryRecord to MemoryDBRecord", () => {
      const record = {
        id: "mem-1",
        scope: { namespace: "test", entityId: "user-1", agentId: "agent-1" },
        collection: "facts",
        content: { kind: "text" as const, text: "Hello" },
        wmem: true,
        smemExpiresAt: 1704153600000,
        timestamp: 1704067200000,
        createdAt: 1704067200000,
        updatedAt: 1704070800000,
        metadata: { source: "test" },
      };

      const dbRecord = MemoryRecordCodec.encode(record);

      expect(dbRecord.id).toBe("mem-1");
      expect(dbRecord.namespace).toBe("test");
      expect(dbRecord.entity_id).toBe("user-1");
      expect(dbRecord.agent_id).toBe("agent-1");
      expect(dbRecord.collection).toBe("facts");
      expect(dbRecord.content).toEqual({ kind: "text", text: "Hello" });
      expect(dbRecord.wmem).toBe(true);
      expect(dbRecord.smem_expires_at).toBe(1704153600000);
      expect(dbRecord.timestamp).toBe(1704067200000);
      expect(dbRecord.created_at).toBe(1704067200000);
      expect(dbRecord.updated_at).toBe(1704070800000);
      expect(dbRecord.metadata).toEqual({ source: "test" });
    });

    it("should handle undefined scope fields as null", () => {
      const record = {
        id: "mem-2",
        scope: {},
        collection: "facts",
        content: { kind: "text" as const, text: "Test" },
        wmem: false,
        smemExpiresAt: null,
        timestamp: 1704067200000,
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
        metadata: null,
      };

      const dbRecord = MemoryRecordCodec.encode(record);

      expect(dbRecord.namespace).toBeNull();
      expect(dbRecord.entity_id).toBeNull();
      expect(dbRecord.agent_id).toBeNull();
    });
  });

  describe("decode", () => {
    it("should decode MemoryDBRecord to MemoryRecord", () => {
      const dbRecord = {
        id: "mem-1",
        namespace: "test",
        entity_id: "user-1",
        agent_id: "agent-1",
        collection: "facts",
        content: { kind: "object" as const, value: { foo: "bar" } },
        wmem: false,
        smem_expires_at: null,
        timestamp: 1704067200000,
        created_at: 1704067200000,
        updated_at: 1704070800000,
        metadata: null,
      };

      const record = MemoryRecordCodec.decode(dbRecord);

      expect(record.id).toBe("mem-1");
      expect(record.scope.namespace).toBe("test");
      expect(record.scope.entityId).toBe("user-1");
      expect(record.scope.agentId).toBe("agent-1");
      expect(record.collection).toBe("facts");
      expect(record.content).toEqual({ kind: "object", value: { foo: "bar" } });
      expect(record.wmem).toBe(false);
      expect(record.smemExpiresAt).toBeNull();
      expect(record.timestamp).toBe(1704067200000);
      expect(record.createdAt).toBe(1704067200000);
      expect(record.updatedAt).toBe(1704070800000);
      expect(record.metadata).toBeNull();
    });
  });

  describe("round-trip encoding/decoding", () => {
    it("should preserve data through encode -> decode cycle", () => {
      const original = {
        id: "mem-rt",
        scope: { namespace: "test", entityId: "user-1" },
        collection: "conversations",
        content: { kind: "text" as const, text: "Round trip test" },
        wmem: true,
        smemExpiresAt: 1704153600000,
        timestamp: 1704067200000,
        createdAt: 1704067200000,
        updatedAt: 1704070800000,
        metadata: { roundTrip: true },
      };

      const encoded = MemoryRecordCodec.encode(original);
      const decoded = MemoryRecordCodec.decode(encoded);

      expect(decoded.id).toBe(original.id);
      expect(decoded.scope.namespace).toBe(original.scope.namespace);
      expect(decoded.scope.entityId).toBe(original.scope.entityId);
      expect(decoded.collection).toBe(original.collection);
      expect(decoded.content).toEqual(original.content);
      expect(decoded.wmem).toBe(original.wmem);
      expect(decoded.smemExpiresAt).toBe(original.smemExpiresAt);
      expect(decoded.timestamp).toBe(original.timestamp);
      expect(decoded.createdAt).toBe(original.createdAt);
      expect(decoded.updatedAt).toBe(original.updatedAt);
      expect(decoded.metadata).toEqual(original.metadata);
    });
  });
});
