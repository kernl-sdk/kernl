/**
 * MemoryByte encoder - converts MemoryByte to IndexableByte with embeddings.
 */

import type { EmbeddingModel, JSONObject } from "@kernl-sdk/protocol";
import { stringify as yamlStringify } from "yaml";

import type { MemoryByte, IndexableByte, MemoryByteCodec } from "../types";

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
 * If no embedder is provided, skips embedding and tvec will be undefined.
 */
export class MemoryByteEncoder implements MemoryByteCodec {
  private readonly embedder?: EmbeddingModel<string>;

  constructor(embedder?: EmbeddingModel<string>) {
    this.embedder = embedder;
  }

  /**
   * Encode a MemoryByte to IndexableByte.
   *
   * - Produces `objtext` string projection for FTS indexing
   * - Combines text + objtext for embedding input
   * - Returns text (fallback to objtext if no text provided)
   */
  async encode(byte: MemoryByte): Promise<IndexableByte> {
    const objtext = byte.object
      ? ObjectTextCodec.encode(byte.object) // encode object as embeddable string
      : undefined;

    // (TODO): this behavior deserves consideration - do we always want to merge text + object?
    //
    // combine text + object for richer embedding
    // skip embedding if no embedder configured (embed returns null)
    const combined = [byte.text, objtext].filter(Boolean).join("\n");
    const tvec = combined ? await this.embed(combined) : null;

    // TODO: embed other modalities (image, audio, video)
    //
    // const ivec = byte.image ? await this.embedImage(byte.image) : undefined;
    // const avec = byte.audio ? await this.embedAudio(byte.audio) : undefined;
    // const vvec = byte.video ? await this.embedVideo(byte.video) : undefined;

    return {
      text: byte.text ?? objtext, // fallback to projection if no text
      objtext,
      tvec: tvec ?? undefined,
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
   *
   * @returns Embedding vector, or null if no embedder configured.
   * @throws If embedder returns empty embedding.
   */
  async embed(text: string): Promise<number[] | null> {
    if (!this.embedder) {
      return null;
    }
    const result = await this.embedder.embed({ values: [text] });
    const embedding = result.embeddings[0];
    if (!embedding || embedding.length === 0) {
      throw new Error("Embedder returned empty embedding");
    }
    return embedding;
  }
}
