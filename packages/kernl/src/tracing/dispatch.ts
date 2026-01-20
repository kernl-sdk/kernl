import { AsyncLocalStorage } from "node:async_hooks";

import type { SpanId, SpanData, EventData } from "./types";
import type { Subscriber } from "./subscriber";
import { Span, SpanImpl, NoopSpan } from "./span";

// -----------------------------------------------------------------------------
// Span Context (AsyncLocalStorage)
// -----------------------------------------------------------------------------

interface SpanContext {
  spanId: SpanId | null;
}

const gctx = new AsyncLocalStorage<SpanContext>();

/**
 * Get the current span ID from async context.
 */
export function current(): SpanId | null {
  return gctx.getStore()?.spanId ?? null;
}

/**
 * Run a function within a span context.
 * All spans created within `fn` will have `spanId` as their parent (unless overridden).
 */
export function run<T>(spanId: SpanId | null, fn: () => T): T {
  return gctx.run({ spanId }, fn);
}

// -----------------------------------------------------------------------------
// Global Subscriber
// -----------------------------------------------------------------------------

let globalSubscriber: Subscriber | null = null;

/**
 * Set the global subscriber. Can only be set once.
 */
export function setSubscriber(subscriber: Subscriber): void {
  if (globalSubscriber !== null) {
    throw new Error("Global subscriber already set");
  }
  globalSubscriber = subscriber;
}

/**
 * Clear the global subscriber.
 */
export function clearSubscriber(): void {
  globalSubscriber = null;
}

/**
 * Get the current global subscriber.
 */
export function getSubscriber(): Subscriber | null {
  return globalSubscriber;
}

// -----------------------------------------------------------------------------
// Span Creation
// -----------------------------------------------------------------------------

type ParentOption = SpanId | "current" | null;

/**
 * Create a new span.
 *
 * @param data - The span data (must include `kind`)
 * @param parent - Parent span: SpanId, "current" (from async context), or null (no parent)
 * @returns A Span object for managing the span lifecycle
 */
export function span<T extends SpanData>(
  data: T,
  parent: ParentOption = "current",
): Span<T> {
  const subscriber = globalSubscriber;

  if (!subscriber || !subscriber.enabled(data)) {
    return new NoopSpan<T>();
  }

  const resolvedParent = parent === "current" ? current() : parent;

  const id = subscriber.span(data, resolvedParent);

  return new SpanImpl<T>(id, subscriber);
}

// -----------------------------------------------------------------------------
// Event Emission
// -----------------------------------------------------------------------------

type EventParentOption = SpanId | "current" | null;

/**
 * Emit an event (moment in time, no duration).
 *
 * @param data - The event data (must include `kind`)
 * @param parent - Parent span: SpanId, "current" (from async context), or null (no parent)
 */
export function event(
  data: EventData,
  parent: EventParentOption = "current",
): void {
  const subscriber = globalSubscriber;
  if (!subscriber) return;

  const resolvedParent = parent === "current" ? current() : parent;

  subscriber.event(data, resolvedParent);
}
