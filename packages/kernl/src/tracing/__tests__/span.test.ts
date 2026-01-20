import { describe, it, expect, beforeEach } from "vitest";

import { SpanImpl, NoopSpan } from "../span";
import { TestSubscriber } from "./helpers";

describe("SpanImpl", () => {
  let subscriber: TestSubscriber;
  let span: SpanImpl;

  beforeEach(() => {
    subscriber = new TestSubscriber();
    span = new SpanImpl("test_span_1", subscriber);
  });

  describe("id", () => {
    it("should return the span id", () => {
      expect(span.id).toBe("test_span_1");
    });
  });

  describe("noop", () => {
    it("should return false", () => {
      expect(span.noop()).toBe(false);
    });
  });

  describe("enter", () => {
    it("should call subscriber.enter", () => {
      span.enter();
      expect(subscriber.entered.has("test_span_1")).toBe(true);
    });

    it("should be idempotent (double enter does nothing)", () => {
      span.enter();
      span.enter();

      const enterCalls = subscriber.calls.filter(
        (c) => c.method === "enter" && c.spanId === "test_span_1",
      );
      expect(enterCalls).toHaveLength(1);
    });

    it("should not enter after close", () => {
      span.close();
      span.enter();

      expect(subscriber.entered.has("test_span_1")).toBe(false);
    });
  });

  describe("exit", () => {
    it("should call subscriber.exit after enter", () => {
      span.enter();
      span.exit();
      expect(subscriber.exited.has("test_span_1")).toBe(true);
    });

    it("should not exit if not entered", () => {
      span.exit();
      expect(subscriber.exited.has("test_span_1")).toBe(false);
    });

    it("should be idempotent (double exit does nothing)", () => {
      span.enter();
      span.exit();
      span.exit();

      const exitCalls = subscriber.calls.filter(
        (c) => c.method === "exit" && c.spanId === "test_span_1",
      );
      expect(exitCalls).toHaveLength(1);
    });

    it("should not exit after close", () => {
      span.enter();
      span.close();
      subscriber.exited.clear(); // clear the exit from close
      subscriber.calls = [];

      span.exit();
      expect(subscriber.exited.has("test_span_1")).toBe(false);
    });
  });

  describe("record", () => {
    it("should call subscriber.record", () => {
      span.record({ state: "running" } as any);

      const recorded = subscriber.getRecorded("test_span_1");
      expect(recorded).toHaveLength(1);
      expect(recorded[0]).toEqual({ state: "running" });
    });

    it("should allow multiple records", () => {
      span.record({ state: "running" } as any);
      span.record({ result: "done" } as any);

      const recorded = subscriber.getRecorded("test_span_1");
      expect(recorded).toHaveLength(2);
    });

    it("should not record after close", () => {
      span.close();
      span.record({ state: "running" } as any);

      const recorded = subscriber.getRecorded("test_span_1");
      expect(recorded).toHaveLength(0);
    });
  });

  describe("error", () => {
    it("should call subscriber.error", () => {
      const err = new Error("test error");
      span.error(err);

      const errors = subscriber.errors.get("test_span_1");
      expect(errors).toHaveLength(1);
      expect(errors![0]).toBe(err);
    });

    it("should allow multiple errors", () => {
      span.error(new Error("error 1"));
      span.error(new Error("error 2"));

      const errors = subscriber.errors.get("test_span_1");
      expect(errors).toHaveLength(2);
    });

    it("should not error after close", () => {
      span.close();
      span.error(new Error("test"));

      const errors = subscriber.errors.get("test_span_1");
      expect(errors).toBeUndefined();
    });
  });

  describe("close", () => {
    it("should call subscriber.close", () => {
      span.close();
      expect(subscriber.closed.has("test_span_1")).toBe(true);
    });

    it("should be idempotent (double close does nothing)", () => {
      span.close();
      span.close();

      const closeCalls = subscriber.calls.filter(
        (c) => c.method === "close" && c.spanId === "test_span_1",
      );
      expect(closeCalls).toHaveLength(1);
    });

    it("should auto-exit if entered but not exited", () => {
      span.enter();
      span.close();

      expect(subscriber.exited.has("test_span_1")).toBe(true);
      expect(subscriber.closed.has("test_span_1")).toBe(true);

      // Verify order: exit before close
      const exitIndex = subscriber.calls.findIndex(
        (c) => c.method === "exit" && c.spanId === "test_span_1",
      );
      const closeIndex = subscriber.calls.findIndex(
        (c) => c.method === "close" && c.spanId === "test_span_1",
      );
      expect(exitIndex).toBeLessThan(closeIndex);
    });

    it("should not exit if already exited", () => {
      span.enter();
      span.exit();
      subscriber.calls = []; // clear calls

      span.close();

      const exitCalls = subscriber.calls.filter(
        (c) => c.method === "exit" && c.spanId === "test_span_1",
      );
      expect(exitCalls).toHaveLength(0);
    });

    it("should not exit if never entered", () => {
      span.close();

      expect(subscriber.exited.has("test_span_1")).toBe(false);
      expect(subscriber.closed.has("test_span_1")).toBe(true);
    });
  });

  describe("full lifecycle", () => {
    it("should handle enter -> record -> exit -> close", () => {
      span.enter();
      span.record({ state: "running" } as any);
      span.exit();
      span.close();

      expect(subscriber.isComplete("test_span_1")).toBe(true);

      const methods = subscriber.calls
        .filter((c) => c.spanId === "test_span_1")
        .map((c) => c.method);
      expect(methods).toEqual(["enter", "record", "exit", "close"]);
    });

    it("should handle enter -> error -> close (auto-exit)", () => {
      span.enter();
      span.error(new Error("oops"));
      span.close();

      expect(subscriber.isComplete("test_span_1")).toBe(true);

      const methods = subscriber.calls
        .filter((c) => c.spanId === "test_span_1")
        .map((c) => c.method);
      expect(methods).toEqual(["enter", "error", "exit", "close"]);
    });
  });
});

describe("NoopSpan", () => {
  let span: NoopSpan;

  beforeEach(() => {
    span = new NoopSpan();
  });

  describe("id", () => {
    it("should return null", () => {
      expect(span.id).toBeNull();
    });
  });

  describe("noop", () => {
    it("should return true", () => {
      expect(span.noop()).toBe(true);
    });
  });

  describe("methods", () => {
    it("should not throw on any method", () => {
      expect(() => span.enter()).not.toThrow();
      expect(() => span.exit()).not.toThrow();
      expect(() => span.record({ state: "running" } as any)).not.toThrow();
      expect(() => span.error(new Error("test"))).not.toThrow();
      expect(() => span.close()).not.toThrow();
    });
  });
});
