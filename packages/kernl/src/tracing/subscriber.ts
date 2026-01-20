import type { SpanId, SpanData, EventData } from "./types";

/**
 * A Subscriber receives span and event notifications from the tracing system.
 *
 * Implementations can export data to backends like Laminar, log to console,
 * collect metrics, etc.
 */
export interface Subscriber {
  /**
   * Returns whether this subscriber is interested in spans of this kind.
   * If false, a noop span is returned and no further methods are called.
   */
  enabled(data: SpanData): boolean;

  /**
   * Called when a new span is created. Returns a unique SpanId for this span.
   */
  span(data: SpanData, parent: SpanId | null): SpanId;

  /**
   * Called when a span is entered (execution begins within the span).
   */
  enter(span: SpanId): void;

  /**
   * Called when a span is exited (execution leaves the span, but span may not be done).
   */
  exit(span: SpanId): void;

  /**
   * Called to record additional data on an existing span.
   */
  record(span: SpanId, delta: Partial<SpanData>): void;

  /**
   * Called when an error occurs within a span.
   */
  error(span: SpanId, error: Error): void;

  /**
   * Called when a span is closed (span is complete and will not receive more data).
   * Implicitly calls exit() if the span was entered but not yet exited.
   */
  close(span: SpanId): void;

  /**
   * Called when an event (moment in time, no duration) occurs.
   */
  event(data: EventData, parent: SpanId | null): void;

  /**
   * Flush any buffered data to the backend.
   */
  flush(): Promise<void>;

  /**
   * Gracefully shutdown the subscriber, flushing remaining data.
   * @param timeout Optional timeout in milliseconds
   */
  shutdown(timeout?: number): Promise<void>;
}
