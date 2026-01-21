import type { Codec } from "@kernl-sdk/shared/lib";
import type { SpanData, EventData } from "kernl/tracing";

export type SpanType = "DEFAULT" | "LLM" | "TOOL";

export const SPAN_NAME: Codec<SpanData, string> = {
  encode: (data) => {
    switch (data.kind) {
      case "thread":
        return `thread.${data.agentId}`;
      case "model.call":
        return `model.${data.provider}.${data.modelId}`;
      case "tool.call":
        return `tool.${data.toolId}`;
      default:
        return `kernl.unknown`;
    }
  },
  decode: () => {
    throw new Error("SPAN_NAME.decode: unimplemented");
  },
};

export const SPAN_TYPE: Codec<SpanData["kind"], SpanType> = {
  encode: (kind) => {
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
  },
  decode: () => {
    throw new Error("SPAN_TYPE.decode: unimplemented");
  },
};

export const SPAN_INPUT: Codec<SpanData, Record<string, unknown>> = {
  encode: (data) => {
    const { kind, ...rest } = data;
    return rest;
  },
  decode: () => {
    throw new Error("SPAN_INPUT.decode: unimplemented");
  },
};

export const EVENT_ATTRIBUTES: Codec<
  EventData,
  Record<string, string | number | boolean>
> = {
  encode: (data) => {
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        result[key] = value;
      } else if (value !== undefined) {
        result[key] = JSON.stringify(value);
      }
    }
    return result;
  },
  decode: () => {
    throw new Error("EVENT_ATTRIBUTES.decode: unimplemented");
  },
};
