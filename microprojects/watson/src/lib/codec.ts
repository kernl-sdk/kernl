/**
 * Bidirectional codec for converting between types.
 */
export interface Codec<TFrom, TInto> {
  encode: (val: TFrom) => TInto;
  decode: (val: TInto) => TFrom;
}

/**
 * Async bidirectional codec for converting between types.
 */
export interface AsyncCodec<TFrom, TInto> {
  encode: (val: TFrom) => Promise<TInto>;
  decode: (val: TInto) => Promise<TFrom>;
}
