import { describe, it, expect, beforeEach, vi } from "vitest";
import { RUNNING, STOPPED } from "@kernl-sdk/protocol";

import { NewThreadCodec } from "../thread";

describe("NewThreadCodec", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  describe("encode", () => {
    it("should apply default values (tick=0, state='stopped')", () => {
      const newThread = {
        id: "thread-1",
        namespace: "kernl",
        agentId: "agent-1",
        model: "openai/gpt-4",
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.tick).toBe(0);
      expect(record.state).toBe("stopped");
      expect(record.parent_task_id).toBeNull();
      expect(record.metadata).toBeNull();
    });

    it("should preserve provided values", () => {
      const newThread = {
        id: "thread-2",
        namespace: "kernl",
        agentId: "agent-2",
        model: "openai/gpt-4",
        tick: 5,
        state: RUNNING as any,
        metadata: { key: "value" },
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.tick).toBe(5);
      expect(record.state).toBe(RUNNING);
      expect(record.metadata).toEqual({ key: "value" });
    });

    it("should apply current timestamp when not provided", () => {
      const now = Date.now(); // Mocked to 2024-01-01T00:00:00.000Z

      const newThread = {
        id: "thread-3",
        namespace: "kernl",
        agentId: "agent-3",
        model: "anthropic/claude-3",
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.created_at).toBe(now);
      expect(record.updated_at).toBe(now);
    });

    it("should preserve provided timestamps", () => {
      const createdAt = new Date("2023-12-01T00:00:00.000Z");
      const updatedAt = new Date("2023-12-15T00:00:00.000Z");

      const newThread = {
        id: "thread-4",
        namespace: "kernl",
        agentId: "agent-4",
        model: "openai/gpt-4",
        createdAt,
        updatedAt,
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.created_at).toBe(createdAt.getTime());
      expect(record.updated_at).toBe(updatedAt.getTime());
    });

    it("should handle context", () => {
      const context = { foo: "bar", nested: { key: "value" } };

      const newThread = {
        id: "thread-5",
        namespace: "kernl",
        agentId: "agent-5",
        model: "openai/gpt-4",
        context: context as any,
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.context).toEqual(context);
    });

    it("should apply empty object as default context", () => {
      const newThread = {
        id: "thread-6",
        namespace: "kernl",
        agentId: "agent-6",
        model: "openai/gpt-4",
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.context).toEqual({});
    });

    it("should map model field correctly", () => {
      const newThread = {
        id: "thread-7",
        namespace: "kernl",
        agentId: "agent-7",
        model: "provider/model-name",
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.model).toBe("provider/model-name");
    });

    it("should handle parentTaskId", () => {
      const newThread = {
        id: "thread-8",
        namespace: "kernl",
        agentId: "agent-8",
        model: "openai/gpt-4",
        parentTaskId: "task-123",
      };

      const record = NewThreadCodec.encode(newThread);

      expect(record.parent_task_id).toBe("task-123");
    });
  });

  describe("decode", () => {
    it("should decode ThreadRecord to NewThread", () => {
      const record = {
        id: "thread-1",
        namespace: "kernl",
        agent_id: "agent-1",
        model: "openai/gpt-4",
        context: { foo: "bar" },
        tick: 5,
        state: RUNNING as any,
        parent_task_id: "task-1",
        metadata: { key: "value" },
        created_at: 1704067200000, // 2024-01-01T00:00:00.000Z
        updated_at: 1704070800000, // 2024-01-01T01:00:00.000Z
      };

      const newThread = NewThreadCodec.decode(record);

      expect(newThread.id).toBe("thread-1");
      expect(newThread.agentId).toBe("agent-1");
      expect(newThread.model).toBe("openai/gpt-4");
      expect(newThread.context).toEqual({ foo: "bar" });
      expect(newThread.tick).toBe(5);
      expect(newThread.state).toBe(RUNNING);
      expect(newThread.parentTaskId).toBe("task-1");
      expect(newThread.metadata).toEqual({ key: "value" });
      expect(newThread.createdAt).toEqual(new Date(1704067200000));
      expect(newThread.updatedAt).toEqual(new Date(1704070800000));
    });

    it("should handle null values", () => {
      const record = {
        id: "thread-2",
        namespace: "kernl",
        agent_id: "agent-2",
        model: "openai/gpt-4",
        context: {},
        tick: 0,
        state: STOPPED as any,
        parent_task_id: null,
        metadata: null,
        created_at: 1704067200000,
        updated_at: 1704067200000,
      };

      const newThread = NewThreadCodec.decode(record);

      expect(newThread.parentTaskId).toBeNull();
      expect(newThread.metadata).toBeNull();
    });
  });

  describe("round-trip encoding/decoding", () => {
    it("should preserve data through encode -> decode cycle", () => {
      const original = {
        id: "thread-rt",
        namespace: "kernl",
        agentId: "agent-rt",
        model: "openai/gpt-4",
        tick: 10,
        state: RUNNING as any,
        context: { test: true } as any,
        parentTaskId: "task-rt",
        metadata: { source: "test" },
      };

      const encoded = NewThreadCodec.encode(original);
      const decoded = NewThreadCodec.decode(encoded);

      expect(decoded.id).toBe(original.id);
      expect(decoded.agentId).toBe(original.agentId);
      expect(decoded.model).toBe(original.model);
      expect(decoded.tick).toBe(original.tick);
      expect(decoded.state).toBe(original.state);
      expect(decoded.context).toEqual(original.context);
      expect(decoded.parentTaskId).toBe(original.parentTaskId);
      expect(decoded.metadata).toEqual(original.metadata);
    });
  });
});
