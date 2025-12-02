/**
 * Schema conversion codecs.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldSchema,
  VectorFieldSchema,
  ScalarFieldSchema,
} from "@kernl-sdk/retrieval";
import type {
  AttributeSchema,
  AttributeSchemaConfig,
  DistanceMetric,
} from "@turbopuffer/turbopuffer/resources/namespaces";

type Similarity = VectorFieldSchema["similarity"];
type ScalarType = ScalarFieldSchema["type"];
type TpufType = string;

/**
 * Mapping from kernl scalar types to Turbopuffer attribute types.
 */
const SCALAR_TO_TPUF: Record<string, TpufType> = {
  string: "string",
  int: "int",
  bigint: "uint", // Unix epoch timestamps in ms
  float: "int", // tpuf doesn't have float
  boolean: "bool",
  date: "datetime",
  "string[]": "[]string",
  "int[]": "[]int",
  "date[]": "[]datetime",
};

/**
 * Mapping from Turbopuffer attribute types to kernl scalar types.
 */
const TPUF_TO_SCALAR: Record<string, ScalarType> = {
  string: "string",
  int: "int",
  uint: "bigint",
  bool: "boolean",
  datetime: "date",
  "[]string": "string[]",
  "[]int": "int[]",
  "[]datetime": "date[]",
};

/**
 * Codec for converting kernl scalar types to Turbopuffer attribute types.
 */
export const SCALAR_TYPE: Codec<ScalarType, TpufType> = {
  encode: (type) => SCALAR_TO_TPUF[type] ?? "string",
  decode: (type) => TPUF_TO_SCALAR[type] ?? "string",
};

/**
 * Codec for converting similarity metric to Turbopuffer distance metric.
 *
 * Turbopuffer supports: cosine_distance, euclidean_squared
 * We support: cosine, euclidean, dot_product
 */
export const SIMILARITY: Codec<Similarity, DistanceMetric> = {
  encode: (similarity) => {
    switch (similarity) {
      case "euclidean":
        return "euclidean_squared";
      case "cosine":
      case "dot_product":
      default:
        return "cosine_distance";
    }
  },

  decode: (metric) => {
    switch (metric) {
      case "euclidean_squared":
        return "euclidean";
      case "cosine_distance":
      default:
        return "cosine";
    }
  },
};

/**
 * Codec-like converter for FieldSchema to Turbopuffer AttributeSchema.
 *
 * Takes the field name as context since Turbopuffer requires `ann: true`
 * only on the special `vector` attribute.
 */
export const FIELD_SCHEMA = {
  encode: (field: FieldSchema, name: string): AttributeSchema => {
    // Vector fields
    if (field.type === "vector" || field.type === "sparse-vector") {
      const vf = field as VectorFieldSchema;
      const precision = vf.quantization === "f16" ? "f16" : "f32";
      return {
        type: `[${vf.dimensions}]${precision}`,
        ann: name === "vector",
      };
    }

    // Scalar fields
    const config: AttributeSchemaConfig = {
      type: SCALAR_TYPE.encode(field.type),
    };

    if (field.filterable) {
      config.filterable = true;
    }

    if (field.fts) {
      config.full_text_search =
        typeof field.fts === "object"
          ? { language: field.fts.language as never }
          : true;
    }

    return config;
  },

  decode: () => {
    throw new Error("FIELD_SCHEMA.decode: not implemented");
  },
};

/**
 * Codec for converting a full schema record.
 *
 * Validates that vector fields are named `vector` since Turbopuffer only
 * supports ANN indexing on that specific attribute name.
 */
export const INDEX_SCHEMA: Codec<
  Record<string, FieldSchema>,
  Record<string, AttributeSchema>
> = {
  encode: (schema) => {
    const result: Record<string, AttributeSchema> = {};

    for (const [name, field] of Object.entries(schema)) {
      const isVector =
        field.type === "vector" || field.type === "sparse-vector";

      // Enforce vector field naming
      if (isVector && name !== "vector") {
        throw new Error(
          `Turbopuffer requires vector fields to be named "vector", got "${name}". ` +
            `Rename your field or use a different search provider.`,
        );
      }

      result[name] = FIELD_SCHEMA.encode(field, name);
    }

    return result;
  },

  decode: () => {
    throw new Error("INDEX_SCHEMA.decode: not implemented");
  },
};
