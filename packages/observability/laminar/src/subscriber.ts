import { Laminar, type LaminarSpanContext, type Span } from "@lmnr-ai/lmnr";
import type {
  Subscriber,
  SpanId,
  SpanData,
  EventData,
  ModelCallSpan,
  ToolCallSpan,
  ThreadSpan,
} from "kernl/tracing";

import { SPAN_NAME, SPAN_TYPE, SPAN_INPUT, EVENT_ATTRIBUTES } from "./convert";
import {
  extractSessionId,
  extractUserId,
  setPromptAttributes,
  setCompletionAttributes,
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
 * import { Kernl } from 'kernl';
 * import { LaminarTracer } from '@kernl-sdk/lmnr';
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

  /**
   * Check if a span should be recorded. Always returns true.
   */
  enabled(_data: SpanData): boolean {
    return true;
  }

  /**
   * Create a new span and send it to Laminar.
   * Sets gen_ai semantic convention attributes for LLM spans.
   */
  span(data: SpanData, parent: SpanId | null): SpanId {
    const id = `span_${this.nextId++}`;

    // get parent context for linking
    const parentRecord = parent ? this.spans.get(parent) : null;
    const parentSpanContext = parentRecord?.context ?? undefined;

    // extract session/user from thread context
    const sessionId = extractSessionId(data);
    const userId = extractUserId(data);

    // create the Laminar span
    const s = Laminar.startSpan({
      name: SPAN_NAME.encode(data),
      spanType: SPAN_TYPE.encode(data.kind),
      input: SPAN_INPUT.encode(data),
      parentSpanContext,
      tags: this.options.tags,
      sessionId,
      userId,
      metadata: this.options.metadata as Record<string, any>,
    });

    // set gen_ai semantic convention attributes for LLM spans
    if (data.kind === "model.call") {
      s.setAttribute("gen_ai.system", data.provider);
      s.setAttribute("gen_ai.request.model", data.modelId);

      // Format input messages for native UI
      if (data.request?.input) {
        setPromptAttributes(s, data.request.input);
      }
    }

    // get context for future children
    const context = Laminar.getLaminarSpanContext(s);

    this.spans.set(id, { span: s, data, context });
    return id;
  }

  /**
   * Called when entering a span's execution context.
   * Laminar tracks timing from startSpan() to end(), so this is a no-op.
   */
  enter(_spanId: SpanId): void {
    // Laminar tracks timing from startSpan() to end()
  }

  /**
   * Called when exiting a span's execution context.
   * Laminar tracks timing from startSpan() to end(), so this is a no-op.
   */
  exit(_spanId: SpanId): void {}

  /**
   * Record additional data on an active span.
   * Updates gen_ai semantic convention attributes for LLM responses.
   */
  record(spanId: SpanId, delta: Partial<SpanData>): void {
    const record = this.spans.get(spanId);
    if (!record) return;

    Object.assign(record.data, delta);

    switch (record.data.kind) {
      case "thread": {
        const d = delta as Partial<ThreadSpan>;
        if (d.state) {
          record.span.setAttribute("thread.state", JSON.stringify(d.state));
        }
        if (d.result !== undefined) {
          record.span.setAttribute(
            "lmnr.span.output",
            JSON.stringify(d.result),
          );
        }
        if (d.error) {
          record.span.setAttribute("thread.error", d.error);
        }
        break;
      }
      case "model.call": {
        const d = delta as Partial<ModelCallSpan>;
        if (!d.response) break;
        if (d.response.usage) {
          record.span.setAttribute(
            "gen_ai.usage.input_tokens",
            d.response.usage.inputTokens?.total ?? 0,
          );
          record.span.setAttribute(
            "gen_ai.usage.output_tokens",
            d.response.usage.outputTokens?.total ?? 0,
          );
        }
        if (d.response.content) {
          setCompletionAttributes(record.span, d.response.content);
          record.span.setAttribute(
            "lmnr.span.output",
            JSON.stringify(d.response.content),
          );
        }
        break;
      }
      case "tool.call": {
        const d = delta as Partial<ToolCallSpan>;
        if (d.result !== undefined) {
          record.span.setAttribute(
            "lmnr.span.output",
            JSON.stringify(d.result),
          );
        }
        if (d.error) {
          record.span.setAttribute("tool.call.error", d.error);
        }
        break;
      }
    }
  }

  /**
   * Record an error on a span.
   */
  error(spanId: SpanId, error: Error): void {
    const record = this.spans.get(spanId);
    if (!record) return;
    record.span.recordException(error);
  }

  /**
   * Close a span, ending its duration and sending it to Laminar.
   */
  close(spanId: SpanId): void {
    const record = this.spans.get(spanId);
    if (!record) return;
    record.span.end();
    this.spans.delete(spanId);
  }

  /**
   * Emit a standalone event to Laminar.
   */
  event(data: EventData, _parent: SpanId | null): void {
    Laminar.event({
      name: data.kind,
      attributes: EVENT_ATTRIBUTES.encode(data),
    });
  }

  /**
   * Flush pending spans to Laminar.
   */
  async flush(): Promise<void> {
    await Laminar.flush();
  }

  /**
   * Shutdown the tracer and flush remaining data.
   */
  async shutdown(_timeout?: number): Promise<void> {
    await Laminar.shutdown();
  }
}
