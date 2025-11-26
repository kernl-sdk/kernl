/**
 * Turbopuffer SearchIndex implementation.
 *
 * Adapts the Turbopuffer vector database to the kernl SearchIndex interface.
 * Turbopuffer uses "namespaces" as the equivalent of our "indexes".
 *
 * @see https://turbopuffer.com/docs
 */

import Turbopuffer from "@turbopuffer/turbopuffer";

import type {
  SearchIndex,
  SearchDocument,
  SearchDocumentPatch,
  SearchQuery,
  SearchHit,
  NewIndexParams,
  ListIndexesParams,
  IndexSummary,
  DescribeIndexParams,
  DeleteIndexParams,
  DeleteDocParams,
  DeleteManyParams,
  IndexStats,
} from "@kernl-sdk/retrieval";
import { CursorPage, type CursorPageResponse } from "@kernl-sdk/shared";

import { TurbopufferConfig } from "./types";
import {
  INDEX_SCHEMA,
  SIMILARITY,
  DOCUMENT,
  PATCH,
  QUERY,
  FILTER,
  SEARCH_HIT,
} from "./convert";

/**
 * Turbopuffer search index adapter.
 *
 * Implements the kernl SearchIndex interface backed by Turbopuffer's
 * vector database. Supports vector search, full-text search (BM25),
 * and hybrid queries.
 *
 * @example
 * ```ts
 * const tpuf = new TurbopufferSearchIndex({
 *   apiKey: "your-api-key",
 *   region: "us-east-1",
 * });
 *
 * await tpuf.upsert({
 *   id: "doc-1",
 *   index: "my-index",
 *   fields: {
 *     text: "Hello world",
 *     vector: { kind: "vector", values: [0.1, 0.2, ...] },
 *   },
 * });
 *
 * const hits = await tpuf.query({
 *   index: "my-index",
 *   vector: [0.1, 0.2, ...],
 *   topK: 10,
 * });
 * ```
 */
export class TurbopufferSearchIndex implements SearchIndex {
  readonly id = "turbopuffer";

  private readonly client: Turbopuffer;

  /**
   * Create a new Turbopuffer search index.
   */
  constructor(config: TurbopufferConfig = {}) {
    this.client = new Turbopuffer({
      apiKey: config.apiKey,
      region: config.region,
    });
  }

  /* ---- Index lifecycle ---- */

  /**
   * Create a new index (namespace) in Turbopuffer.
   */
  async createIndex(params: NewIndexParams): Promise<void> {
    const ns = this.client.namespace(params.id);
    const schema = INDEX_SCHEMA.encode(params.schema);

    const placeholder = "__kernl_placeholder__";
    const vfield = params.schema.vector;
    const vector = vfield?.type === "vector";

    // implicit creation via first write
    await ns.write({
      schema,
      distance_metric: vector
        ? SIMILARITY.encode(vfield.similarity)
        : undefined,
      upsert_rows: [
        {
          id: placeholder,
          vector: vector ? new Array(vfield.dimensions).fill(0) : undefined,
        },
      ],
    });

    await ns.write({ deletes: [placeholder] });
  }

  /**
   * List indexes (namespaces) with optional pagination and prefix filtering.
   */
  async listIndexes(
    params: ListIndexesParams = {},
  ): Promise<CursorPage<IndexSummary, ListIndexesParams>> {
    const loader = async (
      p: ListIndexesParams,
    ): Promise<CursorPageResponse<IndexSummary>> => {
      const page = await this.client.namespaces({
        prefix: p.prefix,
        cursor: p.cursor,
        page_size: p.limit,
      });

      const indexes: IndexSummary[] = [];
      for await (const ns of page) {
        indexes.push({ id: ns.id });
      }

      return {
        data: indexes,
        next: page.next_cursor ?? null,
        last: !page.next_cursor,
      };
    };

    const response = await loader(params);

    return new CursorPage({
      params,
      response,
      loader,
    });
  }

  /**
   * Get metadata and statistics about an index (namespace).
   */
  async describeIndex(params: DescribeIndexParams): Promise<IndexStats> {
    const ns = this.client.namespace(params.id);
    const metadata = await ns.metadata();

    return {
      id: params.id,
      count: metadata.approx_row_count,
      sizeb: metadata.approx_logical_bytes,
      status: "ready",
    };
  }

  /**
   * Delete an index (namespace) and all its documents.
   */
  async deleteIndex(params: DeleteIndexParams): Promise<void> {
    const ns = this.client.namespace(params.id);
    await ns.deleteAll();
  }

  /* ---- Document operations ---- */

  /**
   * Search for documents using vector search, full-text search, or filters.
   */
  async query(query: SearchQuery): Promise<SearchHit[]> {
    const ns = this.client.namespace(query.index);
    const params = QUERY.encode(query);

    const res = await ns.query(params);
    if (!res.rows) {
      return [];
    }

    return res.rows.map((row) => SEARCH_HIT.decode(row, query.index));
  }

  /**
   * Upsert a single document.
   */
  async upsert(document: SearchDocument): Promise<void> {
    const ns = this.client.namespace(document.index);
    await ns.write({ upsert_rows: [DOCUMENT.encode(document)] });
  }

  /**
   * Upsert multiple documents.
   */
  async mupsert(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    // group by index
    const byindex = new Map<string, SearchDocument[]>();
    for (const doc of documents) {
      const list = byindex.get(doc.index) ?? [];
      list.push(doc);
      byindex.set(doc.index, list);
    }

    // (TODO): consider parallelizing here ..
    //
    // write to each index
    for (const [index, docs] of byindex) {
      const ns = this.client.namespace(index);
      await ns.write({ upsert_rows: docs.map(DOCUMENT.encode) });
    }
  }

  /**
   * Update a document's fields (partial update).
   * null values unset the field.
   */
  async update(patch: SearchDocumentPatch): Promise<void> {
    const ns = this.client.namespace(patch.index);
    await ns.write({ patch_rows: [PATCH.encode(patch)] });
  }

  /**
   * Update multiple documents.
   */
  async mupdate(patches: SearchDocumentPatch[]): Promise<void> {
    if (patches.length === 0) return;

    // group by index
    const byindex = new Map<string, SearchDocumentPatch[]>();
    for (const patch of patches) {
      const list = byindex.get(patch.index) ?? [];
      list.push(patch);
      byindex.set(patch.index, list);
    }

    for (const [index, ps] of byindex) {
      const ns = this.client.namespace(index);
      await ns.write({ patch_rows: ps.map(PATCH.encode) });
    }
  }

  /**
   * Delete a single document by ID.
   */
  async delete(params: DeleteDocParams): Promise<void> {
    const ns = this.client.namespace(params.index);
    await ns.write({ deletes: [params.id] });
  }

  /**
   * Delete multiple documents by IDs or filter.
   */
  async mdelete(params: DeleteManyParams): Promise<void> {
    const ns = this.client.namespace(params.index);

    if (params.ids && params.ids.length > 0) {
      await ns.write({ deletes: params.ids });
    }

    if (params.filter) {
      await ns.write({ delete_by_filter: FILTER.encode(params.filter) });
    }
  }
}
