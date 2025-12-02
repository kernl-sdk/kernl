/**
 * MemoryByte encoder - converts MemoryByte to IndexableByte with embeddings.
 */

import type { EmbeddingModel } from "@kernl-sdk/protocol";

import type { MemoryByte, IndexableByte, MemoryByteCodec } from "./types";

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
   * Extracts text and computes embeddings for each modality.
   */
  async encode(byte: MemoryByte): Promise<IndexableByte> {
    const text = byte.text;
    const tvec = text ? await this.embed(text) : undefined;

    // TODO: embed other modalities (image, audio, video)
    // const ivec = byte.image ? await this.embedImage(byte.image) : undefined;
    // const avec = byte.audio ? await this.embedAudio(byte.audio) : undefined;
    // const vvec = byte.video ? await this.embedVideo(byte.video) : undefined;

    return {
      text,
      tvec,
      metadata: byte.object ?? null,
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
