/**
 * Schema conversion codecs for pgvector.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldSchema,
  VectorFieldSchema,
  ScalarFieldSchema,
} from "@kernl-sdk/retrieval";

type ScalarType = ScalarFieldSchema["type"];
type Similarity = VectorFieldSchema["similarity"];

/**
 * Mapping from kernl scalar types to Postgres column types.
 */
const SCALAR_TO_PG: Record<string, string> = {
  string: "TEXT",
  int: "INTEGER",
  bigint: "BIGINT",
  float: "DOUBLE PRECISION",
  boolean: "BOOLEAN",
  date: "TIMESTAMPTZ",
  object: "JSONB",
  geopoint: "POINT",
};

/**
 * Codec for converting FieldSchema to Postgres column type.
 */
export const FIELD_TYPE: Codec<FieldSchema, string> = {
  encode: (schema) => {
    if (schema.type === "vector") {
      return `vector(${schema.dimensions})`;
    }
    return SCALAR_TO_PG[schema.type] ?? "TEXT";
  },
  decode: () => {
    throw new Error("FIELD_TYPE.decode not implemented");
  },
};

/**
 * Mapping from similarity metric to pgvector operator class.
 */
const SIMILARITY_TO_OPCLASS: Record<string, string> = {
  cosine: "vector_cosine_ops",
  euclidean: "vector_l2_ops",
  dot_product: "vector_ip_ops",
};

/**
 * Codec for converting similarity metric to pgvector HNSW operator class.
 */
export const SIMILARITY: Codec<Similarity | undefined, string> = {
  encode: (similarity) => SIMILARITY_TO_OPCLASS[similarity ?? "cosine"],
  decode: () => {
    throw new Error("SIMILARITY.decode not implemented");
  },
};
