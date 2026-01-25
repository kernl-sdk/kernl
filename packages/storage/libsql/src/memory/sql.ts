/**
 * Memory SQL conversion codecs for LibSQL.
 *
 * Uses ? placeholders instead of PostgreSQL's $1, $2, etc.
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { MemoryFilter, MemoryRecordUpdate } from "kernl";

import { type SQLClause, expandarray } from "../sql";

export interface WhereInput {
  filter?: MemoryFilter;
}

/**
 * Encode MemoryFilter to SQL WHERE clause with ? placeholders.
 */
export const SQL_WHERE: Codec<WhereInput, SQLClause> = {
  encode({ filter }) {
    if (!filter) {
      return { sql: "", params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.scope?.namespace !== undefined) {
      conditions.push(`namespace = ?`);
      params.push(filter.scope.namespace);
    }
    if (filter.scope?.entityId !== undefined) {
      conditions.push(`entity_id = ?`);
      params.push(filter.scope.entityId);
    }
    if (filter.scope?.agentId !== undefined) {
      conditions.push(`agent_id = ?`);
      params.push(filter.scope.agentId);
    }
    if (filter.collections && filter.collections.length > 0) {
      const { placeholders, params: collectionParams } = expandarray(
        filter.collections,
      );
      conditions.push(`collection IN (${placeholders})`);
      params.push(...collectionParams);
    }
    if (filter.wmem !== undefined) {
      conditions.push(`wmem = ?`);
      params.push(filter.wmem ? 1 : 0); // SQLite uses 0/1 for boolean
    }
    if (filter.smem === true) {
      conditions.push(`(smem_expires_at IS NOT NULL AND smem_expires_at > ?)`);
      params.push(Date.now());
    } else if (filter.smem === false) {
      conditions.push(`(smem_expires_at IS NULL OR smem_expires_at <= ?)`);
      params.push(Date.now());
    }
    if (filter.after !== undefined) {
      conditions.push(`timestamp > ?`);
      params.push(filter.after);
    }
    if (filter.before !== undefined) {
      conditions.push(`timestamp < ?`);
      params.push(filter.before);
    }

    return {
      sql: conditions.length > 0 ? conditions.join(" AND ") : "",
      params,
    };
  },

  decode() {
    throw new Error("SQL_WHERE.decode not implemented");
  },
};

type OrderDirection = "asc" | "desc";

export interface OrderInput {
  order?: OrderDirection;
  defaultColumn?: string;
  defaultDirection?: OrderDirection;
}

/**
 * Encode order options to SQL ORDER BY clause.
 */
export const ORDER: Codec<OrderInput, string> = {
  encode({ order, defaultColumn = "timestamp", defaultDirection = "desc" }) {
    const dir = (order ?? defaultDirection).toUpperCase();
    return `${defaultColumn} ${dir}`;
  },

  decode() {
    throw new Error("ORDER.decode not implemented");
  },
};

export interface PatchInput {
  patch: MemoryRecordUpdate;
}

/**
 * Encode MemoryRecordUpdate to SQL SET clause with ? placeholders.
 */
export const SQL_UPDATE: Codec<PatchInput, SQLClause> = {
  encode({ patch }) {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.content !== undefined) {
      sets.push(`content = ?`);
      params.push(JSON.stringify(patch.content));
    }
    if (patch.wmem !== undefined) {
      sets.push(`wmem = ?`);
      params.push(patch.wmem ? 1 : 0); // SQLite uses 0/1 for boolean
    }
    if (patch.smem !== undefined) {
      sets.push(`smem_expires_at = ?`);
      params.push(patch.smem.expiresAt);
    }
    if (patch.metadata !== undefined) {
      sets.push(`metadata = ?`);
      params.push(patch.metadata ? JSON.stringify(patch.metadata) : null);
    }

    // always update updated_at
    sets.push(`updated_at = ?`);
    params.push(Date.now());

    return {
      sql: sets.join(", "),
      params,
    };
  },

  decode() {
    throw new Error("SQL_UPDATE.decode not implemented");
  },
};
