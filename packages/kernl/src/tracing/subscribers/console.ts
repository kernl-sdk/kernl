import type { SpanId, SpanData, EventData } from "../types";
import type { Subscriber } from "../subscriber";

interface SpanRecord {
  data: SpanData;
  parent: SpanId | null;
  startTime: number;
  entered: boolean;
}

/**
 * A simple console subscriber for development and debugging.
 * Logs span lifecycle events and events to the console.
 */
export class ConsoleSubscriber implements Subscriber {
  private spans = new Map<SpanId, SpanRecord>();
  private nextId = 0;

  enabled(_data: SpanData): boolean {
    return true;
  }

  span(data: SpanData, parent: SpanId | null): SpanId {
    const id = `span_${this.nextId++}`;
    this.spans.set(id, {
      data,
      parent,
      startTime: Date.now(),
      entered: false,
    });
    console.log(`[span:new] ${id} ${data.kind}`, this.fmt(data));
    return id;
  }

  enter(spanId: SpanId): void {
    const record = this.spans.get(spanId);
    if (record) {
      record.entered = true;
      console.log(`[span:enter] ${spanId} ${record.data.kind}`);
    }
  }

  exit(spanId: SpanId): void {
    const record = this.spans.get(spanId);
    if (record) {
      console.log(`[span:exit] ${spanId} ${record.data.kind}`);
    }
  }

  record(spanId: SpanId, delta: Partial<SpanData>): void {
    const record = this.spans.get(spanId);
    if (record) {
      Object.assign(record.data, delta);
      console.log(`[span:record] ${spanId}`, this.fmt(delta));
    }
  }

  error(spanId: SpanId, error: Error): void {
    const record = this.spans.get(spanId);
    if (record) {
      console.log(`[span:error] ${spanId} ${record.data.kind}`, error.message);
    }
  }

  close(spanId: SpanId): void {
    const record = this.spans.get(spanId);
    if (record) {
      const duration = Date.now() - record.startTime;
      console.log(`[span:close] ${spanId} ${record.data.kind} (${duration}ms)`);
      this.spans.delete(spanId);
    }
  }

  event(data: EventData, parent: SpanId | null): void {
    console.log(`[event] ${data.kind}`, { ...data, parent });
  }

  async flush(): Promise<void> {
    // Console subscriber doesn't buffer
  }

  async shutdown(_timeout?: number): Promise<void> {
    this.spans.clear();
  }

  private fmt(data: Partial<SpanData>): Record<string, unknown> {
    const { kind, ...rest } = data as any;
    // Truncate large fields for readability
    const formatted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === "string" && value.length > 100) {
        formatted[key] = value.slice(0, 100) + "...";
      } else if (Array.isArray(value) && value.length > 3) {
        formatted[key] = `[${value.length} items]`;
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  }
}
