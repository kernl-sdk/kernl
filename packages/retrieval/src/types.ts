/**
 * Generic search and retrieval types.
 */

import type { CursorPageParams } from "@kernl-sdk/shared";

// ---------------------
// Field Types & Values
// ---------------------

type ScalarType = "string" | "int" | "float" | "boolean" | "date";
type ComplexType = "object" | "geopoint";
type VectorType = "vector" | "sparse-vector";
type ArrayableType = ScalarType | ComplexType;

/**
 * Supported field types in a search schema.
 */
export type SearchFieldType =
  | ScalarType
  | ComplexType
  | VectorType
  | `${ArrayableType}[]`;

/**
 * Geographic point.
 */
export interface GeoPoint {
  lat: number;
  long: number;
}

/**
 * Dense vector embedding.
 */
export interface DenseVector {
  kind: "vector";
  values: number[];
}

/**
 * Sparse vector (for hybrid/BM25 style search).
 */
export interface SparseVector {
  kind: "sparse-vector";
  indices: number[];
  values: number[];
}

type ScalarValue = string | number | boolean | null;

/**
 * Field value - the actual data stored in a field.
 *
 * A field is in one of two states:
 * - *Has a value*: any non-null value
 * - *No value*: `null`, `undefined`, or omitted entirely
 *
 * The system treats `null` and `undefined` (or missing) as equivalent.
 * Adapters normalize "no value" internally (e.g., storing as SQL NULL).
 *
 * For filter semantics:
 * - `{ field: value }` matches docs where field has that non-null value
 * - `{ field: null }` matches docs where field has no value (null or missing)
 * - `{ field: { $exists: true } }` matches docs where field has a value
 * - `{ field: { $exists: false } }` matches docs where field has no value
 */
export type FieldValue =
  | ScalarValue
  | ScalarValue[]
  | GeoPoint
  | GeoPoint[]
  | DenseVector
  | SparseVector
  | { [key: string]: FieldValue }
  | { [key: string]: FieldValue }[]
  | undefined; // normalized to null

// ---------------------
// Field Schema
// ---------------------

/**
 * Full-text search options for a field.
 */
export interface FTSOptions {
  analyzer?: string;
  language?: string;
}

interface BaseFieldSchema {
  pk?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  optional?: boolean;
  fts?: boolean | FTSOptions;
}

/**
 * Schema for scalar/complex fields.
 */
export interface ScalarFieldSchema extends BaseFieldSchema {
  type: ScalarType | ComplexType | `${ArrayableType}[]`;
}

/**
 * Schema for vector fields.
 */
export interface VectorFieldSchema extends BaseFieldSchema {
  type: VectorType;
  dimensions: number;
  similarity?: "cosine" | "euclidean" | "dot_product";
  quantization?: "f32" | "f16" | "int8" | "binary";
}

/**
 * Field schema - either scalar or vector.
 */
export type FieldSchema = ScalarFieldSchema | VectorFieldSchema;


// ---------------------
// Index Lifecycle
// ---------------------

/**
 * Parameters for creating a new index.
 */
export interface NewIndexParams {
  id: string;
  schema: Record<string, FieldSchema>;
  providerOptions?: Record<string, unknown>;
}

/**
 * Parameters for listing indexes.
 */
export interface ListIndexesParams extends CursorPageParams {
  prefix?: string;
}

/**
 * Summary of an index returned in list results.
 */
export interface IndexSummary {
  id: string;
  count?: number;
  nbytes?: number;
  status?: "ready" | "initializing" | "error";
}

/**
 * Parameters for describing an index.
 */
export interface DescribeIndexParams {
  id: string;
}

/**
 * Parameters for deleting an index.
 */
export interface DeleteIndexParams {
  id: string;
}

/**
 * Statistics about an index.
 */
export interface IndexStats {
  id: string;
  count: number /* number of documents in the index */;
  sizeb?: number /* size of index in bytes */;
  dimensions?: number;
  similarity?: string;
  schema?: Record<string, FieldSchema>;
  status?: "ready" | "initializing" | "error";
}

// ---------------------
// Delete Operations
// ---------------------

/**
 * Parameters for deleting a single document.
 */
export interface DeleteDocParams {
  id: string;
  index: string;
  namespace?: string;
}

/**
 * Parameters for deleting multiple documents.
 */
export interface DeleteManyParams {
  ids?: string[];
  index: string;
  namespace?: string;
  // filter uses the new Filter type from query.ts
}

// ---------------------
// Search Results
// ---------------------

export type UnknownDocument = Record<string, FieldValue>;

/**
 * A search result hit.
 */
export interface SearchHit<TDocument = UnknownDocument> {
  /** Document identifier */
  id: string;
  /** Index the document belongs to */
  index: string;
  /** Optional namespace within the index */
  namespace?: string;
  /** Relevance score for the hit */
  score: number;
  /** Projected document fields (can be partial due to `include`/`exclude`) */
  document?: Partial<TDocument>;
}
