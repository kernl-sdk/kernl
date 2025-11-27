/**
 * Index handle types.
 *
 * An IndexHandle provides document operations and queries on a specific index.
 */

import type { FieldSchema, SearchHit, UnknownDocument } from "./types";
import type { QueryInput } from "./query";

/**
 * Result of an upsert operation.
 */
export interface UpsertResult {
  count: number;
  inserted?: number;
  updated?: number;
}

/**
 * Result of a patch operation.
 */
export interface PatchResult {
  count: number;
}

/**
 * Result of a delete operation.
 */
export interface DeleteResult {
  count: number;
}

/**
 * Document patch - partial update with null to unset fields.
 *
 * Requires `id` (or the configured pkey field). Other fields are optional
 * and can be set to `null` to unset them.
 */
export type DocumentPatch<TDocument> = {
  [K in keyof TDocument]?: TDocument[K] | null;
} & { id: string };

/**
 * Handle to a specific index.
 *
 * @typeParam TDocument - Shape of the document fields. Defaults to `UnknownDocument`.
 *
 * Obtained via `SearchIndex.index(id)`.
 */
export interface IndexHandle<TDocument = UnknownDocument> {
  readonly id: string /* index identifier */;

  /* ---- Documents ---- */

  /**
   * Upsert one or more documents.
   *
   * Documents are flat objects. The adapter determines which field is the
   * primary key (typically `id` by convention).
   *
   * @example
   * ```ts
   * await index.upsert({ id: "doc-1", title: "Hello", embedding: [0.1, ...] });
   * await index.upsert([
   *   { id: "doc-1", title: "Hello" },
   *   { id: "doc-2", title: "World" },
   * ]);
   * ```
   */
  upsert(docs: TDocument | TDocument[]): Promise<UpsertResult>;

  /**
   * Patch one or more documents.
   *
   * Only specified fields are updated. Set a field to `null` to unset it.
   *
   * @example
   * ```ts
   * // update title only
   * await index.patch({ id: "doc-1", title: "New Title" });
   *
   * // unset a field
   * await index.patch({ id: "doc-1", description: null });
   * ```
   */
  patch(
    patches: DocumentPatch<TDocument> | DocumentPatch<TDocument>[],
  ): Promise<PatchResult>;

  /**
   * Delete one or more documents by ID.
   */
  delete(ids: string | string[]): Promise<DeleteResult>;

  /* ---- Query ---- */

  /**
   * Query the index.
   *
   * @example
   * ```ts
   * // simple text search
   * await index.query({ content: "quick fox" });
   *
   * // vector search
   * await index.query({ embedding: [0.1, 0.2, ...] });
   *
   * // hybrid sum fusion
   * await index.query([
   *   { content: "quick fox", weight: 0.7 },
   *   { embedding: [...], weight: 0.3 },
   * ]);
   *
   * // with filter
   * await index.query({
   *   query: [{ content: "fox" }],
   *   filter: { published: true },
   *   topK: 20,
   * });
   * ```
   */
  query(query: QueryInput): Promise<SearchHit<TDocument>[]>;

  /* ---- Schema ---- */

  /**
   * Add a field to the index schema.
   *
   * Not all backends support schema mutation. Throws if unsupported.
   */
  addField(field: string, schema: FieldSchema): Promise<void>;
}
