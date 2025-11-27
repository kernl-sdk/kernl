import type { Pool } from "pg";

import type {
  IndexHandle,
  DocumentPatch,
  QueryInput,
  SearchHit,
  FieldSchema,
  UnknownDocument,
  UpsertResult,
  PatchResult,
  DeleteResult,
} from "@kernl-sdk/retrieval";
import { normalizeQuery } from "@kernl-sdk/retrieval";

import { SEARCH_HIT } from "./hit";
import { sqlize, SQL_SELECT, SQL_WHERE, SQL_ORDER, SQL_LIMIT } from "./sql";
import type { PGIndexConfig } from "./types";
import { parseIndexId, isVector } from "./utils";

/**
 * pgvector-backed IndexHandle.
 */
export class PGIndexHandle<TDocument = UnknownDocument>
  implements IndexHandle<TDocument>
{
  readonly id: string;

  private pool: Pool;
  private ensureInit: () => Promise<void>;
  private config?: PGIndexConfig;

  constructor(
    pool: Pool,
    ensureInit: () => Promise<void>,
    id: string,
    config?: PGIndexConfig,
  ) {
    this.id = id;
    this.pool = pool;
    this.ensureInit = ensureInit;
    this.config = config;
  }

  /**
   * Query the index using vector search, full-text search, or filters.
   */
  async query(input: QueryInput): Promise<SearchHit<TDocument>[]> {
    await this.ensureInit();

    const q = normalizeQuery(input);
    const { schema, table, pkey } = this.table;

    const sqlized = sqlize(q, { pkey, schema, table, binding: this.config });

    const select = SQL_SELECT.encode(sqlized.select);
    const where = SQL_WHERE.encode({
      ...sqlized.where,
      startIdx: select.params.length + 1,
    });
    const order = SQL_ORDER.encode(sqlized.order);
    const limit = SQL_LIMIT.encode({
      ...sqlized.limit,
      startIdx: select.params.length + where.params.length + 1,
    });

    const sql = `
      SELECT ${select.sql}
      FROM "${schema}"."${table}"
      ${where.sql ? `WHERE ${where.sql}` : ""}
      ORDER BY ${order.sql}
      ${limit.sql}
    `;

    const params = [...select.params, ...where.params, ...limit.params];
    const result = await this.pool.query(sql, params);

    return result.rows.map((row) =>
      SEARCH_HIT.decode<TDocument>(row, this.id, this.config),
    );
  }

  /* ---- document ops ---- */

  /**
   * Upsert one or more documents.
   *
   * Documents are flat objects. The pkey field (default "id") is used for
   * conflict resolution. All other fields are written to matching columns.
   */
  async upsert(docs: TDocument | TDocument[]): Promise<UpsertResult> {
    const arr = Array.isArray(docs) ? docs : [docs];
    if (arr.length === 0) return { count: 0, inserted: 0, updated: 0 };

    await this.ensureInit();
    const { schema, table, pkey, fields } = this.table;

    // Find which logical field maps to the pkey column
    let pkeyField = pkey; // default: same name
    for (const [fieldName, fieldCfg] of Object.entries(fields)) {
      if (fieldCfg.column === pkey) {
        pkeyField = fieldName;
        break;
      }
    }

    // collect field names from first doc (excluding the pkey field)
    const first = arr[0] as UnknownDocument;
    const fieldNames = Object.keys(first).filter((k) => k !== pkeyField);

    // map field name → column name (from binding or same name)
    const colFor = (name: string) => fields[name]?.column ?? name;
    const cols = [pkey, ...fieldNames.map(colFor)];

    const params: unknown[] = [];
    const rows: string[] = [];

    for (const doc of arr) {
      const d = doc as UnknownDocument;
      const placeholders: string[] = [];

      // pkey value - use the logical field name, not column name
      const pkval = d[pkeyField];
      if (typeof pkval !== "string") {
        throw new Error(`Document missing string field "${pkeyField}"`);
      }
      params.push(pkval);
      placeholders.push(`$${params.length}`);

      // ...other fields
      for (const field of fieldNames) {
        const val = d[field] ?? null;
        const binding = fields[field];

        // detect vector: explicit binding or runtime check
        const isVec = binding?.type === "vector" || isVector(val);

        params.push(isVec ? JSON.stringify(val) : val);
        placeholders.push(
          isVec ? `$${params.length}::vector` : `$${params.length}`,
        );
      }

      rows.push(`(${placeholders.join(", ")})`);
    }

    // build SET clause for conflict (exclude pkey)
    const sets = cols.slice(1).map((c) => `"${c}" = EXCLUDED."${c}"`);

    // xmax = 0 means inserted, xmax != 0 means updated
    const sql = `
      INSERT INTO "${schema}"."${table}" (${cols.map((c) => `"${c}"`).join(", ")})
      VALUES ${rows.join(", ")}
      ON CONFLICT ("${pkey}") DO UPDATE SET ${sets.join(", ")}
      RETURNING (xmax = 0) as inserted
    `;

    const result = await this.pool.query(sql, params);
    const inserted = result.rows.filter((r) => r.inserted).length;

    return {
      count: result.rowCount ?? 0,
      inserted,
      updated: (result.rowCount ?? 0) - inserted,
    };
  }

  /**
   * Patch one or more documents.
   *
   * Only specified fields are updated. Set a field to `null` to unset it.
   */
  async patch(
    patches: DocumentPatch<TDocument> | DocumentPatch<TDocument>[],
  ): Promise<PatchResult> {
    const arr = Array.isArray(patches) ? patches : [patches];
    if (arr.length === 0) return { count: 0 };

    await this.ensureInit();
    const { schema, table, pkey, fields } = this.table;

    let totalCount = 0;

    // process each patch individually (different fields may be updated)
    for (const patch of arr) {
      const pkval = patch.id;
      if (typeof pkval !== "string") {
        throw new Error(`Patch missing string field "id"`);
      }

      // collect fields to update (excluding pkey)
      const updates: string[] = [];
      const params: unknown[] = [];

      for (const [key, val] of Object.entries(patch)) {
        if (key === "id" || key === pkey) continue;
        if (val === undefined) continue;

        const col = fields[key]?.column ?? key;
        const binding = fields[key];
        const isVec = binding?.type === "vector" || isVector(val);

        params.push(isVec && val !== null ? JSON.stringify(val) : val);
        updates.push(
          `"${col}" = $${params.length}${isVec && val !== null ? "::vector" : ""}`,
        );
      }

      if (updates.length === 0) continue;

      params.push(pkval);
      const sql = `
        UPDATE "${schema}"."${table}"
        SET ${updates.join(", ")}
        WHERE "${pkey}" = $${params.length}
      `;

      const result = await this.pool.query(sql, params);
      totalCount += result.rowCount ?? 0;
    }

    return { count: totalCount };
  }

  /**
   * Delete one or more documents by ID.
   */
  async delete(ids: string | string[]): Promise<DeleteResult> {
    const arr = Array.isArray(ids) ? ids : [ids];
    if (arr.length === 0) return { count: 0 };

    await this.ensureInit();
    const { schema, table, pkey } = this.table;

    const placeholders = arr.map((_, i) => `$${i + 1}`);
    const sql = `
      DELETE FROM "${schema}"."${table}"
      WHERE "${pkey}" IN (${placeholders.join(", ")})
    `;

    const result = await this.pool.query(sql, arr);
    return { count: result.rowCount ?? 0 };
  }

  /* ---- schema ops ---- */

  /**
   * Add a field to the index schema.
   *
   * Not yet implemented - left as a stub until we have a concrete use case
   * to inform the design (e.g. vector-only vs general columns, index creation).
   */
  async addField(_field: string, _schema: FieldSchema): Promise<void> {
    throw new Error("addField not yet implemented");
  }

  // --- internal utils ---

  /**
   * Resolve table config: use explicit binding or derive from conventions.
   */
  private get table() {
    if (this.config) {
      return this.config;
    }

    // convention-based defaults
    const { schema, table } = parseIndexId(this.id);
    return { schema, table, pkey: "id", fields: {} };
  }
}
