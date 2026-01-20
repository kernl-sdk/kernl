import type { SpanId, SpanData, EventData } from "../types";
import type { Subscriber } from "../subscriber";

/**
 * A subscriber that fans out to multiple subscribers.
 *
 * - `enabled()` returns true if ANY subscriber is interested
 * - `span()` calls all subscribers and returns a composite SpanId
 * - All other methods dispatch to all subscribers
 */
export class CompositeSubscriber implements Subscriber {
  private readonly subscribers: Subscriber[];
  private readonly spanMap = new Map<SpanId, SpanId[]>();
  private nextId = 0;

  constructor(subscribers: Subscriber[]) {
    this.subscribers = subscribers;
  }

  enabled(data: SpanData): boolean {
    return this.subscribers.some((s) => s.enabled(data));
  }

  span(data: SpanData, parent: SpanId | null): SpanId {
    const compositeId = `composite_${this.nextId++}`;
    const childIds: SpanId[] = [];

    // Resolve parent for each subscriber
    const parentIds = parent ? this.spanMap.get(parent) : null;

    for (let i = 0; i < this.subscribers.length; i++) {
      const sub = this.subscribers[i];
      if (sub.enabled(data)) {
        const parentId = parentIds?.[i] ?? null;
        const childId = sub.span(data, parentId);
        childIds.push(childId);
      } else {
        childIds.push(""); // placeholder for disabled subscriber
      }
    }

    this.spanMap.set(compositeId, childIds);
    return compositeId;
  }

  enter(span: SpanId): void {
    const ids = this.spanMap.get(span);
    if (!ids) return;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (ids[i]) this.subscribers[i].enter(ids[i]);
    }
  }

  exit(span: SpanId): void {
    const ids = this.spanMap.get(span);
    if (!ids) return;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (ids[i]) this.subscribers[i].exit(ids[i]);
    }
  }

  record(span: SpanId, delta: Partial<SpanData>): void {
    const ids = this.spanMap.get(span);
    if (!ids) return;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (ids[i]) this.subscribers[i].record(ids[i], delta);
    }
  }

  error(span: SpanId, error: Error): void {
    const ids = this.spanMap.get(span);
    if (!ids) return;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (ids[i]) this.subscribers[i].error(ids[i], error);
    }
  }

  close(span: SpanId): void {
    const ids = this.spanMap.get(span);
    if (!ids) return;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (ids[i]) this.subscribers[i].close(ids[i]);
    }
    this.spanMap.delete(span);
  }

  event(data: EventData, parent: SpanId | null): void {
    const parentIds = parent ? this.spanMap.get(parent) : null;
    for (let i = 0; i < this.subscribers.length; i++) {
      const parentId = parentIds?.[i] ?? null;
      this.subscribers[i].event(data, parentId);
    }
  }

  async flush(): Promise<void> {
    await Promise.all(this.subscribers.map((s) => s.flush()));
  }

  async shutdown(timeout?: number): Promise<void> {
    await Promise.all(this.subscribers.map((s) => s.shutdown(timeout)));
  }
}
