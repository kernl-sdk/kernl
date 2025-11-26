/**
 * Document conversion codecs.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type {
  FieldValue,
  DenseVector,
  SearchDocument,
  SearchDocumentPatch,
} from "@kernl-sdk/retrieval";
import type { Row } from "@turbopuffer/turbopuffer/resources/namespaces";

/**
 * Codec for converting SearchDocument to Turbopuffer Row.
 */
export const DOCUMENT: Codec<SearchDocument, Row> = {
  encode: (doc) => {
    const row: Row = { id: doc.id };

    for (const [key, val] of Object.entries(doc.fields)) {
      row[key] = encodeFieldValue(val);
    }

    return row;
  },

  decode: (_row) => {
    throw new Error("DOCUMENT.decode: not implemented");
  },
};

/**
 * Codec for converting SearchDocumentPatch to Turbopuffer Row.
 * null values are passed through to unset the field.
 */
export const PATCH: Codec<SearchDocumentPatch, Row> = {
  encode: (patch) => {
    const row: Row = { id: patch.id };

    for (const [key, val] of Object.entries(patch.fields)) {
      // null values unset the field in Turbopuffer
      row[key] = val === null ? null : encodeFieldValue(val);
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
