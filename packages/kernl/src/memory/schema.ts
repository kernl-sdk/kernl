/**
 * Memory index schema builder.
 */

import type { FieldSchema } from "@kernl-sdk/retrieval";

/**
 * Options for building memory index schema.
 */
export interface MemoryIndexSchemaOptions {
  /**
   * Vector dimensions for embeddings.
   * @default 1536 (OpenAI text-embedding-3-small)
   */
  dimensions?: number;

  /**
   * Similarity metric for vector search.
   * @default "cosine"
   */
  similarity?: "cosine" | "euclidean" | "dot_product";
}

/**
 * Build a canonical memory index schema for vector search.
 *
 * Returns a schema Record that can be used with SearchIndex.createIndex().
 *
 * Schema includes all fields from IndexMemoryRecord:
 * - id: primary key
 * - namespace, entityId, agentId: scope fields (filterable, nullable)
 * - kind, collection: memory attributes (filterable)
 * - timestamp, createdAt, updatedAt: timestamps (filterable + sortable)
 * - text: content text (full-text search)
 * - tvec, ivec, avec, vvec: vector embeddings for text/image/audio/video
 * - metadata: structured metadata (object)
 *
 * @example
 * ```ts
 * const schema = buildMemoryIndexSchema({ dimensions: 1536 });
 * const handle = new MemoryIndexHandle({ index: vector, indexId: "kernl_memories", schema });
 * ```
 */
export function buildMemoryIndexSchema(
  options: MemoryIndexSchemaOptions = {},
): Record<string, FieldSchema> {
  const dimensions = options.dimensions ?? 1536;
  const similarity = options.similarity ?? "cosine";

  const schema: Record<string, FieldSchema> = {
    id: {
      type: "string",
      pk: true,
      sortable: true,
    },

    // scope fields (filterable, nullable)
    namespace: {
      type: "string",
      filterable: true,
      optional: true,
    },
    entityId: {
      type: "string",
      filterable: true,
      optional: true,
    },
    agentId: {
      type: "string",
      filterable: true,
      optional: true,
    },

    // memory attributes (filterable)
    kind: {
      type: "string",
      filterable: true,
    },
    collection: {
      type: "string",
      filterable: true,
    },

    // timestamps (filterable + sortable) - store as bigint to safely handle
    // millisecond Unix epoch values without overflow in SQL backends.
    timestamp: {
      type: "bigint",
      filterable: true,
      sortable: true,
    },
    createdAt: {
      type: "bigint",
      filterable: true,
      sortable: true,
    },
    updatedAt: {
      type: "bigint",
      filterable: true,
      sortable: true,
    },

    // content fields
    text: {
      type: "string",
      fts: true,
      optional: true,
    },
    objtext: {
      type: "string",
      fts: true,
      optional: true,
    },

    // vector fields for different modalities
    tvec: {
      type: "vector",
      dimensions,
      similarity,
      optional: true,
    },
    ivec: {
      type: "vector",
      dimensions,
      similarity,
      optional: true,
    },
    avec: {
      type: "vector",
      dimensions,
      similarity,
      optional: true,
    },
    vvec: {
      type: "vector",
      dimensions,
      similarity,
      optional: true,
    },

    metadata: {
      type: "object",
      optional: true,
    },
  };

  return schema;
}
