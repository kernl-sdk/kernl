/**
 * Document conversion codecs.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldValue,
  DenseVector,
  UnknownDocument,
} from "@kernl-sdk/retrieval";
import type { Row } from "@turbopuffer/turbopuffer/resources/namespaces";

/**
 * Codec for converting documents to Turbopuffer Row.
 *
 * Documents must have an `id` field. All other fields become attributes.
 * Undefined values are omitted.
 */
export const DOCUMENT: Codec<UnknownDocument, Row> = {
  encode: (doc) => {
    const { id, ...fields } = doc;

    if (typeof id !== "string") {
      throw new Error('Document must have a string "id" field');
    }

    const row: Row = { id };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        row[key] = encodeFieldValue(val);
      }
    }

    return row;
  },

  decode: (_row) => {
    throw new Error("DOCUMENT.decode: not implemented");
  },
};

/**
 * Codec for converting document patches to Turbopuffer Row.
 *
 * Similar to DOCUMENT but passes through null values to unset fields.
 */
export const PATCH: Codec<UnknownDocument, Row> = {
  encode: (patch) => {
    const { id, ...fields } = patch;

    if (typeof id !== "string") {
      throw new Error('Patch must have a string "id" field');
    }

    const row: Row = { id };

    for (const [key, val] of Object.entries(fields)) {
      if (val === null) {
        row[key] = null; // null unsets the field in Turbopuffer
      } else if (val !== undefined) {
        row[key] = encodeFieldValue(val);
      }
    }

    return row;
  },

  decode: (_row) => {
    throw new Error("PATCH.decode: not implemented");
  },
};

/**
 * Check if a value is a DenseVector.
 */
function isDenseVector(val: FieldValue): val is DenseVector {
  return (
    typeof val === "object" &&
    val !== null &&
    "kind" in val &&
    val.kind === "vector"
  );
}

/**
 * Convert a FieldValue to Turbopuffer attribute value.
 * Extracts vector values from DenseVector wrapper.
 */
function encodeFieldValue(val: FieldValue): unknown {
  if (isDenseVector(val)) {
    return val.values;
  }
  return val;
}
