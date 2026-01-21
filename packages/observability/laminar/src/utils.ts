import type { Span } from "@lmnr-ai/lmnr";
import type { SpanData } from "kernl/tracing";

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

export function setPromptAttributes(
  span: Span,
  items: Array<{
    kind: string;
    role?: string;
    content?: Array<{ kind: string; text?: string }>;
  }>,
): void {
  let idx = 0;
  for (const item of items) {
    if (item.kind === "message" && item.role && item.content) {
      span.setAttribute(`gen_ai.prompt.${idx}.role`, item.role);
      const content = item.content
        .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
        .map((p) => p.text)
        .join("");
      span.setAttribute(`gen_ai.prompt.${idx}.content`, content);
      idx++;
    }
  }
}

export function setCompletionAttributes(
  span: Span,
  items: Array<{ kind: string; role?: string; text?: string }>,
): void {
  let idx = 0;
  for (const item of items) {
    if (item.kind === "message" && item.role) {
      span.setAttribute(`gen_ai.completion.${idx}.role`, item.role);
      idx++;
    }
    if ((item.kind === "text" || item.kind === "reasoning") && item.text) {
      span.setAttribute(`gen_ai.completion.${idx}.content`, item.text);
      idx++;
    }
  }
}
