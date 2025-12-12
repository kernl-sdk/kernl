/**
 * Memory SQL conversion codecs.
 * /packages/storage/pg/src/memory/sql.ts
 * 
 * TODO: generalize object -> SQL conversion into a shared utility
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { MemoryFilter, MemoryRecordUpdate } from "kernl";

export interface SQLClause {
  sql: string;
  params: unknown[];
}

export interface WhereInput {
  filter?: MemoryFilter;
  startIdx: number;
}

export const SQL_WHERE: Codec<WhereInput, SQLClause> = {
  encode({ filter, startIdx }) {
    if (!filter) {
      return { sql: "", params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    if (filter.scope?.namespace !== undefined) {
      conditions.push(`namespace = $${idx++}`);
      params.push(filter.scope.namespace);
    }
    if (filter.scope?.entityId !== undefined) {
      conditions.push(`entity_id = $${idx++}`);
      params.push(filter.scope.entityId);
    }
    if (filter.scope?.agentId !== undefined) {
      conditions.push(`agent_id = $${idx++}`);
      params.push(filter.scope.agentId);
    }
    if (filter.collections && filter.collections.length > 0) {
      conditions.push(`collection = ANY($${idx++})`);
      params.push(filter.collections);
    }
    if (filter.wmem !== undefined) {
      conditions.push(`wmem = $${idx++}`);
      params.push(filter.wmem);
    }
    if (filter.smem === true) {
      conditions.push(
        `(smem_expires_at IS NOT NULL AND smem_expires_at > $${idx++})`,
      );
      params.push(Date.now());
    } else if (filter.smem === false) {
      conditions.push(
        `(smem_expires_at IS NULL OR smem_expires_at <= $${idx++})`,
      );
      params.push(Date.now());
    }
    if (filter.after !== undefined) {
      conditions.push(`timestamp > $${idx++}`);
      params.push(filter.after);
    }
    if (filter.before !== undefined) {
      conditions.push(`timestamp < $${idx++}`);
      params.push(filter.before);
    }

    return {
      sql: conditions.length > 0 ? conditions.join(" AND ") : "",
      params,
    };
  },

  decode() {
    throw new Error("WHERE.decode not implemented");
  },
};

type OrderDirection = "asc" | "desc";

export interface OrderInput {
  order?: OrderDirection;
  defaultColumn?: string;
  defaultDirection?: OrderDirection;
}

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
  startIdx: number;
}

export const SQL_UPDATE: Codec<PatchInput, SQLClause> = {
  encode({ patch, startIdx }) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    if (patch.content !== undefined) {
      sets.push(`content = $${idx++}::jsonb`);
      params.push(JSON.stringify(patch.content));
    }
    if (patch.wmem !== undefined) {
      sets.push(`wmem = $${idx++}`);
      params.push(patch.wmem);
    }
    if (patch.smem !== undefined) {
      sets.push(`smem_expires_at = $${idx++}`);
      params.push(patch.smem.expiresAt);
    }
    if (patch.metadata !== undefined) {
      sets.push(`metadata = $${idx++}::jsonb`);
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
    throw new Error("PATCH.decode not implemented");
  },
};
