/**
 * Thread SQL conversion codecs.
 *
 * TODO: generalize object -> SQL conversion into a shared utility
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { ThreadFilter, ThreadUpdate, SortOrder } from "kernl";

export interface SQLClause {
  sql: string;
  params: unknown[];
}

export interface WhereInput {
  filter?: ThreadFilter;
  startIdx: number;
}

/**
 * Encode ThreadFilter to SQL WHERE clause.
 */
export const SQL_WHERE: Codec<WhereInput, SQLClause> = {
  encode({ filter, startIdx }) {
    if (!filter) {
      return { sql: "", params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    if (filter.namespace !== undefined) {
      conditions.push(`namespace = $${idx++}`);
      params.push(filter.namespace);
    }

    if (filter.state !== undefined) {
      if (Array.isArray(filter.state)) {
        conditions.push(`state = ANY($${idx++})`);
        params.push(filter.state);
      } else {
        conditions.push(`state = $${idx++}`);
        params.push(filter.state);
      }
    }

    if (filter.agentId !== undefined) {
      conditions.push(`agent_id = $${idx++}`);
      params.push(filter.agentId);
    }

    if (filter.parentTaskId !== undefined) {
      conditions.push(`parent_task_id = $${idx++}`);
      params.push(filter.parentTaskId);
    }

    if (filter.createdAfter !== undefined) {
      conditions.push(`created_at > $${idx++}`);
      params.push(filter.createdAfter.getTime());
    }

    if (filter.createdBefore !== undefined) {
      conditions.push(`created_at < $${idx++}`);
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
  startIdx: number;
}

/**
 * Encode ThreadUpdate to SQL SET clause.
 */
export const SQL_UPDATE: Codec<UpdateInput, SQLClause> = {
  encode({ patch, startIdx }) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    if (patch.tick !== undefined) {
      sets.push(`tick = $${idx++}`);
      params.push(patch.tick);
    }

    if (patch.state !== undefined) {
      sets.push(`state = $${idx++}`);
      params.push(patch.state);
    }

    if (patch.context !== undefined) {
      sets.push(`context = $${idx++}`);
      params.push(JSON.stringify(patch.context.context));
    }

    if (patch.metadata !== undefined) {
      sets.push(`metadata = $${idx++}`);
      params.push(patch.metadata ? JSON.stringify(patch.metadata) : null);
    }

    // always update updated_at
    sets.push(`updated_at = $${idx++}`);
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
