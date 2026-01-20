import { Laminar } from "@lmnr-ai/lmnr";
import type { Span, LaminarSpanContext } from "@lmnr-ai/lmnr";
import type { Subscriber, SpanId, SpanData, EventData } from "kernl/tracing";

import {
  spanName,
  spanType,
  formatInput,
  flattenEventData,
  extractSessionId,
  extractUserId,
} from "./utils";

interface SpanRecord {
  span: Span;
  data: SpanData;
  context: LaminarSpanContext | null;
}

export interface LaminarTracerOptions {
  /**
   * Laminar project API key.
   * If not provided, uses the LMNR_PROJECT_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for the Laminar API.
   * Defaults to https://api.lmnr.ai
   */
  baseUrl?: string;

  /**
   * Tags to apply to all spans.
   */
  tags?: string[];

  /**
   * Metadata to apply to all spans.
   */
  metadata?: Record<string, unknown>;
}

/**
 * A Laminar tracer that exports spans and events to Laminar.
 *
 * Usage:
 * ```ts
 * import { LaminarTracer } from '@kernl-sdk/laminar';
 * import { Kernl } from 'kernl';
 *
 * const kernl = new Kernl({
 *   tracer: new LaminarTracer({
 *     apiKey: process.env.LMNR_PROJECT_API_KEY,
 *   }),
 * });
 * ```
 */
export class LaminarTracer implements Subscriber {
  private spans = new Map<SpanId, SpanRecord>();
  private nextId = 0;
  private options: LaminarTracerOptions;

  constructor(options: LaminarTracerOptions = {}) {
    this.options = options;

    const apiKey = options.apiKey ?? process.env.LMNR_PROJECT_API_KEY;
    if (!apiKey) {
      throw new Error(
        "LaminarTracer requires an API key. " +
          "Pass { apiKey: '...' } or set LMNR_PROJECT_API_KEY environment variable.",
      );
    }

    // Initialize Laminar if not already initialized
    if (!Laminar.initialized()) {
      Laminar.initialize({
        projectApiKey: apiKey,
        baseUrl: options.baseUrl,
        instrumentModules: {}, // disable auto-instrumentation
      });
    }
  }

  enabled(_data: SpanData): boolean {
    return true;
  }

  span(data: SpanData, parent: SpanId | null): SpanId {
    const id = `span_${this.nextId++}`;

    // Get parent context for linking
    const parentRecord = parent ? this.spans.get(parent) : null;
    const parentSpanContext = parentRecord?.context ?? undefined;

    // Extract session/user from thread context
    const sessionId = extractSessionId(data);
    const userId = extractUserId(data);

    // Create the Laminar span
    const laminarSpan = Laminar.startSpan({
      name: spanName(data),
      spanType: spanType(data.kind),
      input: formatInput(data),
      parentSpanContext,
      tags: this.options.tags,
      sessionId,
      userId,
      metadata: this.options.metadata as Record<string, any>,
    });

    // Get context for future children
    const context = Laminar.getLaminarSpanContext(laminarSpan);

    this.spans.set(id, { span: laminarSpan, data, context });
    return id;
  }

  enter(_spanId: SpanId): void {
    // Laminar tracks timing from startSpan() to end()
  }

  exit(_spanId: SpanId): void {
    // Laminar tracks timing from startSpan() to end()
  }

  record(spanId: SpanId, delta: Partial<SpanData>): void {
    const record = this.spans.get(spanId);
    if (!record) return;

    // Update local data
    Object.assign(record.data, delta);

    // Set attributes on the span
    for (const [key, value] of Object.entries(delta)) {
      if (value !== undefined) {
        const serialized =
          typeof value === "string" ? value : JSON.stringify(value);
        record.span.setAttribute(`kernl.${key}`, serialized);
      }
    }

    // Handle special cases for model.call response
    if ("response" in delta && delta.response) {
      const response = delta.response;
      if (response.usage) {
        record.span.setAttribute(
          "gen_ai.usage.input_tokens",
          response.usage.inputTokens?.total ?? 0,
        );
        record.span.setAttribute(
          "gen_ai.usage.output_tokens",
          response.usage.outputTokens?.total ?? 0,
        );
      }
    }
  }

  error(spanId: SpanId, error: Error): void {
    const record = this.spans.get(spanId);
    if (!record) return;
    record.span.recordException(error);
  }

  close(spanId: SpanId): void {
    const record = this.spans.get(spanId);
    if (!record) return;
    record.span.end();
    this.spans.delete(spanId);
  }

  event(data: EventData, _parent: SpanId | null): void {
    Laminar.event({
      name: `kernl.${data.kind}`,
      attributes: flattenEventData(data),
    });
  }

  async flush(): Promise<void> {
    await Laminar.flush();
  }

  async shutdown(_timeout?: number): Promise<void> {
    await Laminar.shutdown();
  }
}
