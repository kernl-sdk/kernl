import type { SpanData, EventData } from "kernl/tracing";

export type SpanType = "DEFAULT" | "LLM" | "TOOL";

export function spanName(data: SpanData): string {
  switch (data.kind) {
    case "thread":
      return `kernl.thread.${data.agentId}`;
    case "model.call":
      return `kernl.model.${data.provider}.${data.modelId}`;
    case "tool.call":
      return `kernl.tool.${data.toolId}`;
    default:
      return `kernl.unknown`;
  }
}

export function spanType(kind: SpanData["kind"]): SpanType {
  switch (kind) {
    case "thread":
      return "DEFAULT";
    case "model.call":
      return "LLM";
    case "tool.call":
      return "TOOL";
    default:
      return "DEFAULT";
  }
}

export function formatInput(data: SpanData): Record<string, unknown> {
  const { kind, ...rest } = data;
  return rest;
}

export function flattenEventData(data: EventData): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (value !== undefined) {
      result[key] = JSON.stringify(value);
    }
  }
  return result;
}

export function extractSessionId(data: SpanData): string | undefined {
  if (data.kind === "thread" && data.context) {
    const ctx = data.context as Record<string, unknown>;
    if (typeof ctx.sessionId === "string") return ctx.sessionId;
  }
  return undefined;
}

export function extractUserId(data: SpanData): string | undefined {
  if (data.kind === "thread" && data.context) {
    const ctx = data.context as Record<string, unknown>;
    if (typeof ctx.userId === "string") return ctx.userId;
  }
  return undefined;
}
