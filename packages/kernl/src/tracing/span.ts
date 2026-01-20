import type { SpanId, SpanData } from "./types";
import type { Subscriber } from "./subscriber";

/**
 * A Span represents a unit of work with duration.
 *
 * Spans track enter/exit for timing, can record additional fields,
 * and must be closed when complete.
 */
export interface Span<T extends SpanData = SpanData> {
  /**
   * The unique identifier for this span, or null if this is a noop span.
   */
  readonly id: SpanId | null;

  /**
   * Mark the span as entered (execution begins).
   */
  enter(): void;

  /**
   * Mark the span as exited (execution paused/left).
   */
  exit(): void;

  /**
   * Record additional fields on the span.
   */
  record(fields: Partial<T>): void;

  /**
   * Record an error on the span.
   */
  error(err: Error): void;

  /**
   * Close the span. Also calls exit() if not already exited.
   */
  close(): void;

  /**
   * Returns true if this is a noop span (tracing disabled).
   */
  noop(): boolean;
}

/**
 * A real span that dispatches to a subscriber.
 */
export class SpanImpl<T extends SpanData = SpanData> implements Span<T> {
  readonly id: SpanId;
  private readonly subscriber: Subscriber;
  private entered = false;
  private exited = false;
  private closed = false;

  constructor(id: SpanId, subscriber: Subscriber) {
    this.id = id;
    this.subscriber = subscriber;
  }

  enter(): void {
    if (this.closed || this.entered) return;
    this.entered = true;
    this.exited = false;
    this.subscriber.enter(this.id);
  }

  exit(): void {
    if (this.closed || !this.entered || this.exited) return;
    this.exited = true;
    this.subscriber.exit(this.id);
  }

  record(fields: Partial<T>): void {
    if (this.closed) return;
    this.subscriber.record(this.id, fields);
  }

  error(err: Error): void {
    if (this.closed) return;
    this.subscriber.error(this.id, err);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.entered && !this.exited) {
      this.subscriber.exit(this.id);
    }
    this.subscriber.close(this.id);
  }

  noop(): boolean {
    return false;
  }
}

/**
 * A noop span that does nothing. Used when tracing is disabled
 * or the subscriber is not interested in this span.
 */
export class NoopSpan<T extends SpanData = SpanData> implements Span<T> {
  readonly id: SpanId | null = null;

  enter(): void {}
  exit(): void {}
  record(_fields: Partial<T>): void {}
  error(_err: Error): void {}
  close(): void {}

  noop(): boolean {
    return true;
  }
}
