/**
 * MemoryByte encoder - converts MemoryByte to IndexableByte with embeddings.
 */

import type { EmbeddingModel, JSONObject } from "@kernl-sdk/protocol";
import { stringify as yamlStringify } from "yaml";

import type { MemoryByte, IndexableByte, MemoryByteCodec } from "./types";

// ---------------------
// ObjectTextCodec
// ---------------------

const MAX_OBJECT_TEXT_LENGTH = 3000;

/**
 * Codec for converting JSONObject to a canonical text representation.
 *
 * Uses YAML for human-readable, deterministic output suitable for:
 * - Full-text search indexing
 * - Embedding input (combined with text field)
 *
 * TODO: Allow users to pass custom codec via MemoryOptions.
 */
export const ObjectTextCodec = {
  /**
   * Encode a JSONObject to canonical text.
   * Uses YAML with sorted keys for determinism.
   * Truncates at MAX_OBJECT_TEXT_LENGTH chars.
   */
  encode(obj: JSONObject): string {
    const yaml = yamlStringify(obj, { sortMapEntries: true });
    if (yaml.length <= MAX_OBJECT_TEXT_LENGTH) {
      return yaml;
    }
    return yaml.slice(0, MAX_OBJECT_TEXT_LENGTH) + "\n...";
  },
};

/**
 * Encoder that converts MemoryByte to IndexableByte.
 *
 * Extracts canonical text from content and computes embeddings.
 */
export class MemoryByteEncoder implements MemoryByteCodec {
  private readonly embedder: EmbeddingModel<string>;

  constructor(embedder: EmbeddingModel<string>) {
    this.embedder = embedder;
  }

  /**
   * Encode a MemoryByte to IndexableByte.
   *
   * - Produces `objtext` string projection for FTS indexing
   * - Combines text + objtext for embedding input
   * - Returns text (fallback to objtext if no text provided)
   *
   * Note: metadata is NOT set here - it comes from record.metadata
   * via the domain codec, not from MemoryByte.object.
   */
  async encode(byte: MemoryByte): Promise<IndexableByte> {
    const objtext = byte.object
      ? ObjectTextCodec.encode(byte.object) // encode object as embeddable string
      : undefined;

    // (TODO): this behavior deserves consideration - do we always want to merge text + object?
    //
    // combine text + object for richer embedding
    const combined = [byte.text, objtext].filter(Boolean).join("\n");
    const tvec = combined ? await this.embed(combined) : undefined;

    // TODO: embed other modalities (image, audio, video)
    //
    // const ivec = byte.image ? await this.embedImage(byte.image) : undefined;
    // const avec = byte.audio ? await this.embedAudio(byte.audio) : undefined;
    // const vvec = byte.video ? await this.embedVideo(byte.video) : undefined;

    return {
      text: byte.text ?? objtext, // fallback to projection if no text
      objtext,
      tvec,
    };
  }

  /**
   * Decode is not implemented - IndexableByte cannot be converted back to MemoryByte.
   */
  async decode(_indexable: IndexableByte): Promise<MemoryByte> {
    throw new Error("MemoryByteEncoder.decode not implemented");
  }

  /**
   * Embed a text string.
   * Exposed for query embedding.
   */
  async embed(text: string): Promise<number[]> {
    const result = await this.embedder.embed({ values: [text] });
    return result.embeddings[0] ?? [];
  }
}
