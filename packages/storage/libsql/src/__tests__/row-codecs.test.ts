import { describe, it, expect } from "vitest";
import type { Row } from "@libsql/client";

import {
  RowToThreadRecord,
  RowToEventRecord,
  RowToEventRecordDirect,
} from "../thread/row";
import { RowToMemoryRecord } from "../memory/row";

/** Cast test data to Row type (libsql rows are array-like) */
const asRow = <T extends Record<string, unknown>>(data: T): Row =>
  data as unknown as Row;

describe("LibSQL row codecs", () => {
  describe("RowToThreadRecord", () => {
    it("decodes thread record with JSON fields", () => {
      const row = asRow({
        id: "thread-1",
        namespace: "default",
        agent_id: "agent-1",
        model: "openai/gpt-4",
        context: '{"userId": "user-1"}',
        tick: 5,
        state: "stopped",
        parent_task_id: null,
        metadata: '{"title": "Test"}',
        created_at: 1700000000000,
        updated_at: 1700000001000,
      });

      const result = RowToThreadRecord.encode(row);

      expect(result).toEqual({
        id: "thread-1",
        namespace: "default",
        agent_id: "agent-1",
        model: "openai/gpt-4",
        context: { userId: "user-1" },
        tick: 5,
        state: "stopped",
        parent_task_id: null,
        metadata: { title: "Test" },
        created_at: 1700000000000,
        updated_at: 1700000001000,
      });
    });

    it("handles null metadata", () => {
      const row = asRow({
        id: "thread-1",
        namespace: "default",
        agent_id: "agent-1",
        model: "openai/gpt-4",
        context: "{}",
        tick: 0,
        state: "stopped",
        parent_task_id: null,
        metadata: null,
        created_at: 1700000000000,
        updated_at: 1700000000000,
      });

      const result = RowToThreadRecord.encode(row);
      expect(result.metadata).toBeNull();
      expect(result.context).toEqual({});
    });
  });

  describe("RowToEventRecord", () => {
    it("decodes event record from join query", () => {
      const row = asRow({
        // thread fields (ignored by this codec)
        id: "thread-1",
        namespace: "default",
        // event fields (with event_ prefix)
        event_id: "evt-1",
        event_tid: "thread-1",
        seq: 1,
        event_kind: "message",
        timestamp: "1700000000000", // BigInt comes as string
        data: '{"role": "user", "content": "Hello"}',
        event_metadata: '{"source": "api"}',
      });

      const result = RowToEventRecord.encode(row);

      expect(result).toEqual({
        id: "evt-1",
        tid: "thread-1",
        seq: 1,
        kind: "message",
        timestamp: 1700000000000,
        data: { role: "user", content: "Hello" },
        metadata: { source: "api" },
      });
    });

    it("handles null data and metadata", () => {
      const row = asRow({
        event_id: "evt-1",
        event_tid: "thread-1",
        seq: 1,
        event_kind: "tick",
        timestamp: 1700000000000,
        data: null,
        event_metadata: null,
      });

      const result = RowToEventRecord.encode(row);
      expect(result.data).toBeNull();
      expect(result.metadata).toBeNull();
    });
  });

  describe("RowToEventRecordDirect", () => {
    it("decodes event record from direct query", () => {
      const row = asRow({
        id: "evt-1",
        tid: "thread-1",
        seq: 1,
        kind: "message",
        timestamp: "1700000000000",
        data: '{"role": "assistant"}',
        metadata: null,
      });

      const result = RowToEventRecordDirect.encode(row);

      expect(result).toEqual({
        id: "evt-1",
        tid: "thread-1",
        seq: 1,
        kind: "message",
        timestamp: 1700000000000,
        data: { role: "assistant" },
        metadata: null,
      });
    });
  });

  describe("RowToMemoryRecord", () => {
    it("decodes memory record with JSON and boolean fields", () => {
      const row = asRow({
        id: "mem-1",
        namespace: "default",
        entity_id: "user-1",
        agent_id: "agent-1",
        kind: "semantic",
        collection: "facts",
        content: '{"text": "User likes coffee"}',
        wmem: 1, // SQLite boolean
        smem_expires_at: 1700100000000,
        timestamp: 1700000000000,
        created_at: 1700000000000,
        updated_at: 1700000001000,
        metadata: '{"confidence": 0.9}',
      });

      const result = RowToMemoryRecord.encode(row);

      expect(result).toEqual({
        id: "mem-1",
        namespace: "default",
        entity_id: "user-1",
        agent_id: "agent-1",
        kind: "semantic",
        collection: "facts",
        content: { text: "User likes coffee" },
        wmem: true,
        smem_expires_at: 1700100000000,
        timestamp: 1700000000000,
        created_at: 1700000000000,
        updated_at: 1700000001000,
        metadata: { confidence: 0.9 },
      });
    });

    it("converts SQLite 0 to false for wmem", () => {
      const row = asRow({
        id: "mem-1",
        namespace: null,
        entity_id: null,
        agent_id: null,
        kind: "episodic",
        collection: null,
        content: "{}",
        wmem: 0,
        smem_expires_at: null,
        timestamp: 1700000000000,
        created_at: 1700000000000,
        updated_at: 1700000000000,
        metadata: null,
      });

      const result = RowToMemoryRecord.encode(row);
      expect(result.wmem).toBe(false);
      expect(result.metadata).toBeNull();
    });
  });
});
