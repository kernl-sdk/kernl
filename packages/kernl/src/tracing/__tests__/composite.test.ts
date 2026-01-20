import { describe, it, expect, beforeEach } from "vitest";

import { CompositeSubscriber } from "../subscribers/composite";
import { TestSubscriber } from "./helpers";

describe("CompositeSubscriber", () => {
  let sub1: TestSubscriber;
  let sub2: TestSubscriber;
  let composite: CompositeSubscriber;

  beforeEach(() => {
    sub1 = new TestSubscriber();
    sub2 = new TestSubscriber();
    composite = new CompositeSubscriber([sub1, sub2]);
  });

  describe("enabled", () => {
    it("should return true if any subscriber is enabled", () => {
      sub1.enabledKinds = new Set(["thread"]);
      sub2.enabledKinds = new Set(["model.call"]);

      expect(composite.enabled({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" })).toBe(true);
      expect(composite.enabled({ kind: "model.call", provider: "test", modelId: "m1" })).toBe(true);
    });

    it("should return false if no subscriber is enabled", () => {
      sub1.enabledKinds = new Set(["thread"]);
      sub2.enabledKinds = new Set(["thread"]);

      expect(composite.enabled({ kind: "model.call", provider: "test", modelId: "m1" })).toBe(false);
    });

    it("should return true if all subscribers are enabled (default)", () => {
      expect(composite.enabled({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" })).toBe(true);
    });
  });

  describe("span", () => {
    it("should create span in all enabled subscribers", () => {
      const data = { kind: "thread" as const, threadId: "t1", agentId: "a1", namespace: "ns" };
      composite.span(data, null);

      expect(sub1.spans.size).toBe(1);
      expect(sub2.spans.size).toBe(1);

      const [, s1] = [...sub1.spans.entries()][0];
      const [, s2] = [...sub2.spans.entries()][0];
      expect(s1.data).toEqual(data);
      expect(s2.data).toEqual(data);
    });

    it("should return composite span ID", () => {
      const id = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );
      expect(id).toMatch(/^composite_\d+$/);
    });

    it("should skip disabled subscribers", () => {
      sub1.enabledKinds = new Set(["thread"]);
      sub2.enabledKinds = new Set(["model.call"]); // not enabled for thread

      composite.span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" }, null);

      expect(sub1.spans.size).toBe(1);
      expect(sub2.spans.size).toBe(0);
    });

    it("should map parent span IDs correctly", () => {
      // Create parent
      const parentId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      // Create child with parent
      composite.span({ kind: "model.call", provider: "test", modelId: "m1" }, parentId);

      // Each subscriber should have correct parent mapping
      const threadSpan1 = sub1.spansOfKind("thread")[0];
      const modelSpan1 = sub1.spansOfKind("model.call")[0];
      expect(modelSpan1.parent).toBe(threadSpan1.id);

      const threadSpan2 = sub2.spansOfKind("thread")[0];
      const modelSpan2 = sub2.spansOfKind("model.call")[0];
      expect(modelSpan2.parent).toBe(threadSpan2.id);
    });
  });

  describe("enter / exit", () => {
    it("should dispatch to all subscribers", () => {
      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      composite.enter(spanId);
      expect(sub1.entered.size).toBe(1);
      expect(sub2.entered.size).toBe(1);

      composite.exit(spanId);
      expect(sub1.exited.size).toBe(1);
      expect(sub2.exited.size).toBe(1);
    });

    it("should skip disabled subscribers", () => {
      sub2.enabledKinds = new Set(["model.call"]); // not enabled for thread

      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      composite.enter(spanId);
      expect(sub1.entered.size).toBe(1);
      expect(sub2.entered.size).toBe(0);
    });
  });

  describe("record", () => {
    it("should dispatch to all subscribers", () => {
      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      composite.record(spanId, { state: "running" } as any);

      const sub1SpanId = [...sub1.spans.keys()][0];
      const sub2SpanId = [...sub2.spans.keys()][0];

      expect(sub1.getRecorded(sub1SpanId)).toHaveLength(1);
      expect(sub2.getRecorded(sub2SpanId)).toHaveLength(1);
    });
  });

  describe("error", () => {
    it("should dispatch to all subscribers", () => {
      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      const err = new Error("test");
      composite.error(spanId, err);

      const sub1SpanId = [...sub1.spans.keys()][0];
      const sub2SpanId = [...sub2.spans.keys()][0];

      expect(sub1.errors.get(sub1SpanId)).toHaveLength(1);
      expect(sub2.errors.get(sub2SpanId)).toHaveLength(1);
    });
  });

  describe("close", () => {
    it("should dispatch to all subscribers and clean up", () => {
      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      composite.close(spanId);

      expect(sub1.closed.size).toBe(1);
      expect(sub2.closed.size).toBe(1);
    });
  });

  describe("event", () => {
    it("should dispatch to all subscribers", () => {
      composite.event({ kind: "thread.error", message: "test" }, null);

      expect(sub1.events).toHaveLength(1);
      expect(sub2.events).toHaveLength(1);
    });

    it("should map parent span IDs correctly", () => {
      const spanId = composite.span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      composite.event({ kind: "thread.error", message: "test" }, spanId);

      const sub1SpanId = [...sub1.spans.keys()][0];
      const sub2SpanId = [...sub2.spans.keys()][0];

      expect(sub1.events[0].parent).toBe(sub1SpanId);
      expect(sub2.events[0].parent).toBe(sub2SpanId);
    });

    it("should handle null parent", () => {
      composite.event({ kind: "thread.error", message: "test" }, null);

      expect(sub1.events[0].parent).toBeNull();
      expect(sub2.events[0].parent).toBeNull();
    });
  });

  describe("flush", () => {
    it("should flush all subscribers", async () => {
      await composite.flush();

      expect(sub1.calls.some((c) => c.method === "flush")).toBe(true);
      expect(sub2.calls.some((c) => c.method === "flush")).toBe(true);
    });
  });

  describe("shutdown", () => {
    it("should shutdown all subscribers", async () => {
      await composite.shutdown(5000);

      expect(sub1.calls.some((c) => c.method === "shutdown")).toBe(true);
      expect(sub2.calls.some((c) => c.method === "shutdown")).toBe(true);
    });
  });
});
