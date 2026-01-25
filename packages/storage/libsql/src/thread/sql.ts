/**
 * Thread SQL conversion codecs for LibSQL.
 *
 * Uses ? placeholders instead of PostgreSQL's $1, $2, etc.
 */

import type { ThreadFilter, ThreadUpdate, SortOrder } from "kernl";
import type { Codec } from "@kernl-sdk/shared/lib";

import { type SQLClause, expandarray } from "../sql";

export interface WhereInput {
  filter?: ThreadFilter;
}

/**
 * Encode ThreadFilter to SQL WHERE clause with ? placeholders.
 */
export const SQL_WHERE: Codec<WhereInput, SQLClause> = {
  encode({ filter }) {
    if (!filter) {
      return { sql: "", params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.namespace !== undefined) {
      conditions.push(`namespace = ?`);
      params.push(filter.namespace);
    }

    if (filter.state !== undefined) {
      if (Array.isArray(filter.state)) {
        const { placeholders, params: stateParams } = expandarray(filter.state);
        conditions.push(`state IN (${placeholders})`);
        params.push(...stateParams);
      } else {
        conditions.push(`state = ?`);
        params.push(filter.state);
      }
    }

    if (filter.agentId !== undefined) {
      conditions.push(`agent_id = ?`);
      params.push(filter.agentId);
    }

    if (filter.parentTaskId !== undefined) {
      conditions.push(`parent_task_id = ?`);
      params.push(filter.parentTaskId);
    }

    if (filter.createdAfter !== undefined) {
      conditions.push(`created_at > ?`);
      params.push(filter.createdAfter.getTime());
    }

    if (filter.createdBefore !== undefined) {
      conditions.push(`created_at < ?`);
      params.push(filter.createdBefore.getTime());
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

export interface OrderInput {
  order?: {
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };
}

/**
 * Encode order options to SQL ORDER BY clause.
 */
export const SQL_ORDER: Codec<OrderInput, string> = {
  encode({ order }) {
    const clauses: string[] = [];

    if (order?.createdAt) {
      clauses.push(`created_at ${order.createdAt.toUpperCase()}`);
    }
    if (order?.updatedAt) {
      clauses.push(`updated_at ${order.updatedAt.toUpperCase()}`);
    }

    if (clauses.length === 0) {
      return "created_at DESC";
    }

    return clauses.join(", ");
  },

  decode() {
    throw new Error("SQL_ORDER.decode not implemented");
  },
};

export interface UpdateInput {
  patch: ThreadUpdate;
}

/**
 * Encode ThreadUpdate to SQL SET clause with ? placeholders.
 */
export const SQL_UPDATE: Codec<UpdateInput, SQLClause> = {
  encode({ patch }) {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.tick !== undefined) {
      sets.push(`tick = ?`);
      params.push(patch.tick);
    }

    if (patch.state !== undefined) {
      sets.push(`state = ?`);
      params.push(patch.state);
    }

    if (patch.context !== undefined) {
      sets.push(`context = ?`);
      params.push(JSON.stringify(patch.context.context));
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
