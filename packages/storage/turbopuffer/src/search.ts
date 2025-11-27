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
  IndexHandle,
  NewIndexParams,
  ListIndexesParams,
  IndexSummary,
  IndexStats,
  UnknownDocument,
} from "@kernl-sdk/retrieval";
import { CursorPage, type CursorPageResponse } from "@kernl-sdk/shared";

import { TurbopufferConfig } from "./types";
import { TurbopufferIndexHandle } from "./handle";
import { INDEX_SCHEMA, SIMILARITY } from "./convert";

/**
 * Turbopuffer search index adapter.
 *
 * Implements the kernl SearchIndex interface backed by Turbopuffer's
 * vector database. Supports vector search, full-text search (BM25),
 * and hybrid queries.
 *
 * @example
 * ```ts
 * const tpuf = turbopuffer({
 *   apiKey: "your-api-key",
 *   region: "us-east-1",
 * });
 *
 * const docs = tpuf.index("my-index");
 *
 * await docs.upsert({
 *   id: "doc-1",
 *   text: "Hello world",
 *   vector: [0.1, 0.2, ...],
 * });
 *
 * const hits = await docs.query({
 *   query: [{ vector: [0.1, 0.2, ...] }],
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
  constructor(config: TurbopufferConfig) {
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
        if (p.limit !== undefined && indexes.length >= p.limit) {
          break; // respect limit if specified
        }
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
  async describeIndex(id: string): Promise<IndexStats> {
    const ns = this.client.namespace(id);
    const metadata = await ns.metadata();

    return {
      id,
      count: metadata.approx_row_count,
      sizeb: metadata.approx_logical_bytes,
      status: "ready",
    };
  }

  /**
   * Delete an index (namespace) and all its documents.
   */
  async deleteIndex(id: string): Promise<void> {
    const ns = this.client.namespace(id);
    await ns.deleteAll();
  }

  /* ---- Index handle ---- */

  /**
   * Get a handle for operating on a specific index.
   */
  index<TDocument = UnknownDocument>(id: string): IndexHandle<TDocument> {
    return new TurbopufferIndexHandle<TDocument>(this.client, id);
  }

  /**
   * Bind an existing resource as an index.
   *
   * Not supported by Turbopuffer - indexes are created implicitly.
   */
  async bindIndex(_id: string, _config: unknown): Promise<void> {
    throw new Error("bindIndex not supported by Turbopuffer");
  }

  /* ---- Utility ---- */

  /**
   * Warm/preload an index for faster queries.
   */
  async warm(id: string): Promise<void> {
    const ns = this.client.namespace(id);
    await ns.hintCacheWarm();
  }
}
