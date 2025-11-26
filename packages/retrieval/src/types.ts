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
 */
export type FieldValue =
  | ScalarValue
  | ScalarValue[]
  | GeoPoint
  | GeoPoint[]
  | DenseVector
  | SparseVector
  | { [key: string]: FieldValue }
  | { [key: string]: FieldValue }[];

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
// Documents
// ---------------------

/**
 * Base document identity.
 */
export interface BaseDocument {
  id: string;
  index: string;
  namespace?: string;
}

/**
 * A document to be indexed.
 */
export interface SearchDocument extends BaseDocument {
  fields: Record<string, FieldValue>;
}

/**
 * A document patch for updates.
 * null values unset the field.
 */
export interface SearchDocumentPatch {
  id: string;
  index: string;
  namespace?: string;
  fields: Record<string, FieldValue | null>;
}

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
  filter?: FilterExpression;
}

// ---------------------
// Query & Filtering
// ---------------------

type OpComparison = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
type OpSet = "in" | "nin";
type OpString = "contains" | "starts_with" | "ends_with";
type OpArray = "contains_all" | "contains_any";
type OpExistence = "exists" | "not_exists";

/**
 * Field comparison operators.
 */
export type FieldOp = OpComparison | OpSet | OpString | OpArray;

/**
 * Existence operators.
 */
export type ExistenceOp = OpExistence;

/**
 * Filter on a field value.
 */
export interface FieldFilter {
  field: string;
  op: FieldOp;
  value: ScalarValue | ScalarValue[];
}

/**
 * Filter on field existence.
 */
export interface ExistsFilter {
  field: string;
  op: ExistenceOp;
}

/**
 * Logical AND of filters.
 */
export interface AndFilter {
  and: FilterExpression[];
}

/**
 * Logical OR of filters.
 */
export interface OrFilter {
  or: FilterExpression[];
}

/**
 * Logical NOT of a filter.
 */
export interface NotFilter {
  not: FilterExpression;
}

/**
 * Filter expression - composable filter tree.
 */
export type FilterExpression =
  | FieldFilter
  | ExistsFilter
  | AndFilter
  | OrFilter
  | NotFilter;

/**
 * Search query parameters.
 */
export interface SearchQuery {
  index: string;
  namespace?: string;

  // Vector search
  vector?: number[];
  sparseVector?: SparseVector;

  // Full-text search
  text?: string;
  textFields?: string[];

  // Hybrid weighting (0 = pure FTS, 1 = pure vector)
  alpha?: number;

  // Filtering
  filter?: FilterExpression;

  // Pagination
  topK?: number;
  offset?: number;

  // Score threshold
  minScore?: number;

  // Response shaping
  include?: string[] | boolean;
  includeVectors?: boolean;
}

/**
 * A search result hit.
 */
export interface SearchHit extends BaseDocument {
  score: number;
  fields?: Record<string, FieldValue>;
  vector?: number[];
  sparseVector?: SparseVector;
}
