import { z, type ZodType } from "zod";

/**
 * Bidirectional codec for converting between types.
 * /packages/shared/src/lib/codec.ts
 *
 * @example
 * ```typescript
 * const tools: Codec<LanguageModelTool[], ProviderTool[]> = {
 *   encode: (tools: Tool[]) => tools.map(convertToProvider),
 *   decode: () => { throw new Error("codec:unimplemented"); },
 * };
 * ```
 */
export interface Codec<TFrom, TInto> {
  /**
   * Transform from input format to output format.
   */
  encode: (val: TFrom) => TInto;

  /**
   * Transform from output format to input format.
   */
  decode: (val: TInto) => TFrom;
}

/**
 * Async bidirectional codec for converting between types.
 *
 * Use when encoding/decoding requires async operations (e.g., embedding models).
 */
export interface AsyncCodec<TFrom, TInto> {
  /**
   * Transform from input format to output format.
   */
  encode: (val: TFrom) => Promise<TInto>;

  /**
   * Transform from output format to input format.
   */
  decode: (val: TInto) => Promise<TFrom>;
}

/**
 * Like z.codec() but only a single schema on TInto.
 *
 * Generally used for serialization from domain -> record types where we want to leave
 * the domain definitions as pure TS for clarity.
 */
export function neapolitanCodec<TFrom, TInto>({
  codec,
  schema,
}: {
  codec: Codec<TFrom, TInto>;
  schema: ZodType<TInto>;
}): Codec<TFrom, TInto> {
  return {
    encode(val: TFrom): TInto {
      const into = codec.encode(val);
      return schema.parse(into);
    },
    decode(val: TInto): TFrom {
      const validated = schema.parse(val);
      return codec.decode(validated as TInto);
    },
  };
}

export const stringToNumber = z.codec(
  z.string().regex(z.regexes.number),
  z.number(),
  {
    decode: (str) => Number.parseFloat(str),
    encode: (num) => num.toString(),
  },
);

export const stringToInt = z.codec(
  z.string().regex(z.regexes.integer),
  z.int(),
  {
    decode: (str) => Number.parseInt(str, 10),
    encode: (num) => num.toString(),
  },
);

export const isotime = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

export const epochsec = z.codec(z.int().min(0), z.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});

export const epochms = z.codec(z.int().min(0), z.date(), {
  decode: (millis) => new Date(millis),
  encode: (date) => date.getTime(),
});

export const json = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

export const stringToURL = z.codec(z.url(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

export const stringToHttpURL = z.codec(z.httpUrl(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

export const base64ToBytes = z.codec(z.base64(), z.instanceof(Uint8Array), {
  decode: (base64String) => z.util.base64ToUint8Array(base64String),
  encode: (bytes) => z.util.uint8ArrayToBase64(bytes),
});

export const base64urlToBytes = z.codec(
  z.base64url(),
  z.instanceof(Uint8Array),
  {
    decode: (base64urlString) => z.util.base64urlToUint8Array(base64urlString),
    encode: (bytes) => z.util.uint8ArrayToBase64url(bytes),
  },
);
