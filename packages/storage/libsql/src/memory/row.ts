/**
 * LibSQL row codecs for memory data.
 */

import type { Row } from "@libsql/client";
import type { Codec } from "@kernl-sdk/shared/lib";
import type { MemoryDBRecord } from "@kernl-sdk/storage";

import { parsejson } from "../utils";

/**
 * Codec for converting LibSQL rows to MemoryDBRecord.
 */
export const RowToMemoryRecord: Codec<Row, MemoryDBRecord> = {
  encode(row: Row): MemoryDBRecord {
    return {
      id: row.id as string,
      namespace: row.namespace as string | null,
      entity_id: row.entity_id as string | null,
      agent_id: row.agent_id as string | null,
      kind: row.kind as "episodic" | "semantic",
      collection: row.collection as string | null,
      content: parsejson<Record<string, unknown>>(row.content) ?? {},
      wmem: Boolean(row.wmem), // Convert SQLite 0/1 to boolean
      smem_expires_at: row.smem_expires_at as number | null,
      timestamp: row.timestamp as number,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
      metadata: parsejson<Record<string, unknown>>(row.metadata),
    };
  },

  decode(): Row {
    throw new Error("RowToMemoryRecord.decode not implemented");
  },
};
