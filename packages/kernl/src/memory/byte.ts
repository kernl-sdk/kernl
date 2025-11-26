/**
 * Memory byte types and codec.
 *
 * MemoryByte is the flexible content format that can hold text, structured JSON,
 * or blob references. The codec converts to/from indexable text for embeddings.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { JSONObject } from "@kernl-sdk/protocol";

/**
 * The kind of memory content.
 */
export type MemoryByteKind = "text" | "object";

/**
 * Memory content - a discriminated union supporting multiple formats.
 */
export type MemoryByte =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "object";
      value: JSONObject;
      summary?: string;
    };

/**
 * Codec for converting MemoryByte to indexable text.
 *
 * encode: MemoryByte -> string (for embedding/search)
 * decode: string -> MemoryByte (for reconstruction)
 */
export type MemoryByteCodec = Codec<MemoryByte, string>;

/**
 * Default codec implementation.
 *
 * - text: returns as-is
 * - json: returns summary if present, else JSON.stringify
 * - blob: returns transcript or caption if present, else empty string
 */
export const defaultMemoryByteCodec: MemoryByteCodec = {
  encode(byte: MemoryByte): string {
    switch (byte.kind) {
      case "text":
        return byte.text;
      case "object":
        return byte.summary ?? JSON.stringify(byte.value);
    }
  },
  decode(text: string): MemoryByte {
    return { kind: "text", text };
  },
};
