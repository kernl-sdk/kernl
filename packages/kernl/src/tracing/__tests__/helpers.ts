import type { SpanId, SpanData, EventData } from "../types";
import type { Subscriber } from "../subscriber";

/**
 * A test subscriber that captures all tracing calls for assertions.
 */
export class TestSubscriber implements Subscriber {
  private nextId = 0;

  // Captured data
  spans = new Map<SpanId, { data: SpanData; parent: SpanId | null }>();
  recorded = new Map<SpanId, Partial<SpanData>[]>();
  errors = new Map<SpanId, Error[]>();
  events: { data: EventData; parent: SpanId | null }[] = [];

  // Call log for verifying order
  calls: { method: string; spanId?: SpanId; args?: unknown }[] = [];

  // State tracking
  entered = new Set<SpanId>();
  exited = new Set<SpanId>();
  closed = new Set<SpanId>();

  // Configuration
  enabledKinds: Set<SpanData["kind"]> | null = null; // null = all enabled

  enabled(data: SpanData): boolean {
    if (this.enabledKinds === null) return true;
    return this.enabledKinds.has(data.kind);
  }

  span(data: SpanData, parent: SpanId | null): SpanId {
    const id = `test_span_${this.nextId++}`;
    this.spans.set(id, { data, parent });
    this.calls.push({ method: "span", spanId: id, args: { data, parent } });
    return id;
  }

  enter(spanId: SpanId): void {
    this.entered.add(spanId);
    this.calls.push({ method: "enter", spanId });
  }

  exit(spanId: SpanId): void {
    this.exited.add(spanId);
    this.calls.push({ method: "exit", spanId });
  }

  record(spanId: SpanId, delta: Partial<SpanData>): void {
    const existing = this.recorded.get(spanId) ?? [];
    existing.push(delta);
    this.recorded.set(spanId, existing);
    this.calls.push({ method: "record", spanId, args: delta });
  }

  error(spanId: SpanId, err: Error): void {
    const existing = this.errors.get(spanId) ?? [];
    existing.push(err);
    this.errors.set(spanId, existing);
    this.calls.push({ method: "error", spanId, args: err });
  }

  close(spanId: SpanId): void {
    this.closed.add(spanId);
    this.calls.push({ method: "close", spanId });
  }

  event(data: EventData, parent: SpanId | null): void {
    this.events.push({ data, parent });
    this.calls.push({ method: "event", args: { data, parent } });
  }

  async flush(): Promise<void> {
    this.calls.push({ method: "flush" });
  }

  async shutdown(_timeout?: number): Promise<void> {
    this.calls.push({ method: "shutdown" });
  }

  // --- Test helpers ---

  /**
   * Get all spans of a specific kind.
   */
  spansOfKind<K extends SpanData["kind"]>(
    kind: K,
  ): Array<{ id: SpanId; data: Extract<SpanData, { kind: K }>; parent: SpanId | null }> {
    const result: Array<{ id: SpanId; data: Extract<SpanData, { kind: K }>; parent: SpanId | null }> = [];
    for (const [id, { data, parent }] of this.spans) {
      if (data.kind === kind) {
        result.push({ id, data: data as Extract<SpanData, { kind: K }>, parent });
      }
    }
    return result;
  }

  /**
   * Get events of a specific kind.
   */
  eventsOfKind<K extends EventData["kind"]>(
    kind: K,
  ): Array<{ data: Extract<EventData, { kind: K }>; parent: SpanId | null }> {
    return this.events.filter((e) => e.data.kind === kind) as Array<{
      data: Extract<EventData, { kind: K }>;
      parent: SpanId | null;
    }>;
  }

  /**
   * Get recorded data for a span.
   */
  getRecorded(spanId: SpanId): Partial<SpanData>[] {
    return this.recorded.get(spanId) ?? [];
  }

  /**
   * Check if a span was fully completed (entered, exited, closed).
   */
  isComplete(spanId: SpanId): boolean {
    return this.entered.has(spanId) && this.exited.has(spanId) && this.closed.has(spanId);
  }

  /**
   * Reset all captured data.
   */
  reset(): void {
    this.nextId = 0;
    this.spans.clear();
    this.recorded.clear();
    this.errors.clear();
    this.events = [];
    this.calls = [];
    this.entered.clear();
    this.exited.clear();
    this.closed.clear();
  }
}
