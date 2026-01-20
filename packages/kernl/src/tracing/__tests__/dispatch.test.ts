import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  span,
  event,
  run,
  current,
  setSubscriber,
  clearSubscriber,
  getSubscriber,
} from "../dispatch";
import { NoopSpan, SpanImpl } from "../span";
import { TestSubscriber } from "./helpers";

describe("dispatch", () => {
  let subscriber: TestSubscriber;

  beforeEach(() => {
    subscriber = new TestSubscriber();
  });

  afterEach(() => {
    clearSubscriber();
  });

  describe("setSubscriber / clearSubscriber / getSubscriber", () => {
    it("should set and get subscriber", () => {
      expect(getSubscriber()).toBeNull();
      setSubscriber(subscriber);
      expect(getSubscriber()).toBe(subscriber);
    });

    it("should throw if subscriber already set", () => {
      setSubscriber(subscriber);
      expect(() => setSubscriber(new TestSubscriber())).toThrow(
        "Global subscriber already set",
      );
    });

    it("should allow re-setting after clear", () => {
      setSubscriber(subscriber);
      clearSubscriber();
      expect(getSubscriber()).toBeNull();

      const newSubscriber = new TestSubscriber();
      setSubscriber(newSubscriber);
      expect(getSubscriber()).toBe(newSubscriber);
    });
  });

  describe("span", () => {
    it("should return NoopSpan when no subscriber is set", () => {
      const s = span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" });
      expect(s).toBeInstanceOf(NoopSpan);
      expect(s.noop()).toBe(true);
    });

    it("should return NoopSpan when subscriber.enabled returns false", () => {
      subscriber.enabledKinds = new Set(["model.call"]); // only model.call enabled
      setSubscriber(subscriber);

      const s = span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" });
      expect(s).toBeInstanceOf(NoopSpan);
      expect(subscriber.spans.size).toBe(0);
    });

    it("should return SpanImpl when subscriber is set and enabled", () => {
      setSubscriber(subscriber);

      const s = span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" });
      expect(s).toBeInstanceOf(SpanImpl);
      expect(s.noop()).toBe(false);
      expect(s.id).toBeDefined();
    });

    it("should pass span data to subscriber", () => {
      setSubscriber(subscriber);

      const data = { kind: "thread" as const, threadId: "t1", agentId: "a1", namespace: "ns" };
      span(data);

      expect(subscriber.spans.size).toBe(1);
      const [, captured] = [...subscriber.spans.entries()][0];
      expect(captured.data).toEqual(data);
    });

    it("should use null parent when parent=null", () => {
      setSubscriber(subscriber);

      span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" }, null);

      const [, captured] = [...subscriber.spans.entries()][0];
      expect(captured.parent).toBeNull();
    });

    it("should use explicit parent when provided", () => {
      setSubscriber(subscriber);

      span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" }, "parent_123");

      const [, captured] = [...subscriber.spans.entries()][0];
      expect(captured.parent).toBe("parent_123");
    });

    it("should resolve parent from context when parent='current' (default)", () => {
      setSubscriber(subscriber);

      // Create parent span
      const parentSpan = span(
        { kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" },
        null,
      );

      // Create child span within run() context
      run(parentSpan.id, () => {
        span({ kind: "model.call", provider: "test", modelId: "m1" });
      });

      const modelSpans = subscriber.spansOfKind("model.call");
      expect(modelSpans).toHaveLength(1);
      expect(modelSpans[0].parent).toBe(parentSpan.id);
    });

    it("should use null parent when parent='current' but no context", () => {
      setSubscriber(subscriber);

      // No run() context
      span({ kind: "thread", threadId: "t1", agentId: "a1", namespace: "ns" });

      const [, captured] = [...subscriber.spans.entries()][0];
      expect(captured.parent).toBeNull();
    });
  });

  describe("run / current", () => {
    it("should return null when no context", () => {
      expect(current()).toBeNull();
    });

    it("should return spanId within run context", () => {
      const result = run("span_123", () => {
        return current();
      });
      expect(result).toBe("span_123");
    });

    it("should return to null after run completes", () => {
      run("span_123", () => {
        expect(current()).toBe("span_123");
      });
      expect(current()).toBeNull();
    });

    it("should support nested run contexts", () => {
      const results: (string | null)[] = [];

      run("outer", () => {
        results.push(current());
        run("inner", () => {
          results.push(current());
        });
        results.push(current());
      });

      expect(results).toEqual(["outer", "inner", "outer"]);
    });

    it("should handle null spanId in run", () => {
      run("span_123", () => {
        run(null, () => {
          expect(current()).toBeNull();
        });
      });
    });
  });

  describe("event", () => {
    it("should do nothing when no subscriber is set", () => {
      // Should not throw
      event({ kind: "thread.error", message: "test" });
    });

    it("should emit event to subscriber", () => {
      setSubscriber(subscriber);

      event({ kind: "thread.error", message: "test error", stack: "stack" });

      expect(subscriber.events).toHaveLength(1);
      expect(subscriber.events[0].data).toEqual({
        kind: "thread.error",
        message: "test error",
        stack: "stack",
      });
    });

    it("should use null parent when parent=null", () => {
      setSubscriber(subscriber);

      event({ kind: "thread.error", message: "test" }, null);

      expect(subscriber.events[0].parent).toBeNull();
    });

    it("should use explicit parent when provided", () => {
      setSubscriber(subscriber);

      event({ kind: "thread.error", message: "test" }, "parent_123");

      expect(subscriber.events[0].parent).toBe("parent_123");
    });

    it("should resolve parent from context when parent='current' (default)", () => {
      setSubscriber(subscriber);

      run("span_123", () => {
        event({ kind: "thread.error", message: "test" });
      });

      expect(subscriber.events[0].parent).toBe("span_123");
    });
  });
});
