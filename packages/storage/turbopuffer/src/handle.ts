/**
 * Turbopuffer index handle implementation.
 */

import type Turbopuffer from "@turbopuffer/turbopuffer";
import type {
  IndexHandle,
  DocumentPatch,
  UpsertResult,
  PatchResult,
  DeleteResult,
  QueryInput,
  SearchHit,
  FieldSchema,
  UnknownDocument,
} from "@kernl-sdk/retrieval";
import { normalizeQuery } from "@kernl-sdk/retrieval";

import { DOCUMENT, PATCH, QUERY, SEARCH_HIT } from "./convert";

/**
 * Handle for operating on a specific Turbopuffer namespace (index).
 */
export class TurbopufferIndexHandle<TDocument = UnknownDocument>
  implements IndexHandle<TDocument>
{
  readonly id: string;
  private client: Turbopuffer;

  constructor(client: Turbopuffer, id: string) {
    this.client = client;
    this.id = id;
  }

  /**
   * Query the index.
   */
  async query(query: QueryInput): Promise<SearchHit<TDocument>[]> {
    const q = normalizeQuery(query);
    const ns = this.client.namespace(this.id);

    const res = await ns.query(QUERY.encode(q));
    if (!res.rows) {
      return [];
    }

    return res.rows.map((row) => SEARCH_HIT.decode<TDocument>(row, this.id));
  }

  /**
   * Upsert one or more documents.
   */
  async upsert(docs: TDocument | TDocument[]): Promise<UpsertResult> {
    const arr = Array.isArray(docs) ? docs : [docs];
    if (arr.length === 0) {
      return { count: 0 };
    }

    const ns = this.client.namespace(this.id);
    const rows = arr.map((doc) => DOCUMENT.encode(doc as UnknownDocument));

    await ns.write({ upsert_rows: rows });
    return { count: arr.length };
  }

  /**
   * Patch one or more documents.
   */
  async patch(
    patches: DocumentPatch<TDocument> | DocumentPatch<TDocument>[],
  ): Promise<PatchResult> {
    const arr = Array.isArray(patches) ? patches : [patches];
    if (arr.length === 0) {
      return { count: 0 };
    }

    const ns = this.client.namespace(this.id);
    const rows = arr.map((p) => PATCH.encode(p as UnknownDocument));

    await ns.write({ patch_rows: rows });
    return { count: arr.length };
  }

  /**
   * Delete one or more documents by ID.
   */
  async delete(ids: string | string[]): Promise<DeleteResult> {
    const arr = Array.isArray(ids) ? ids : [ids];
    if (arr.length === 0) {
      return { count: 0 };
    }

    const ns = this.client.namespace(this.id);
    await ns.write({ deletes: arr });
    return { count: arr.length };
  }

  /**
   * Add a field to the index schema.
   */
  async addField(_field: string, _schema: FieldSchema): Promise<void> {
    throw new Error("addField not supported by Turbopuffer");
  }
}
