/**
 * LibSQL row codecs for thread data.
 */

import type { Row } from "@libsql/client";
import type { Codec } from "@kernl-sdk/shared/lib";
import type { ThreadState } from "kernl";
import type { ThreadRecord, ThreadEventRecord } from "@kernl-sdk/storage";

import { parsejson } from "../utils";

/**
 * Codec for converting LibSQL rows to ThreadRecord.
 */
export const RowToThreadRecord: Codec<Row, ThreadRecord> = {
  encode(row: Row): ThreadRecord {
    return {
      id: row.id as string,
      namespace: row.namespace as string,
      agent_id: row.agent_id as string,
      model: row.model as string,
      context: parsejson<Record<string, unknown>>(row.context) ?? {},
      tick: row.tick as number,
      state: row.state as ThreadState,
      parent_task_id: row.parent_task_id as string | null,
      metadata: parsejson<Record<string, unknown>>(row.metadata),
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
    };
  },

  decode(): Row {
    throw new Error("RowToThreadRecord.decode not implemented");
  },
};

/**
 * Codec for converting LibSQL rows (from JOIN query) to ThreadEventRecord.
 */
export const RowToEventRecord: Codec<Row, ThreadEventRecord> = {
  encode(row: Row): ThreadEventRecord {
    return {
      id: row.event_id as string,
      tid: row.event_tid as string,
      seq: row.seq as number,
      kind: row.event_kind as string,
      timestamp: Number(row.timestamp),
      data: parsejson<Record<string, unknown>>(row.data),
      metadata: parsejson<Record<string, unknown>>(row.event_metadata),
    } as ThreadEventRecord;
  },

  decode(): Row {
    throw new Error("RowToEventRecord.decode not implemented");
  },
};

/**
 * Codec for converting LibSQL rows to ThreadEventRecord (direct query).
 */
export const RowToEventRecordDirect: Codec<Row, ThreadEventRecord> = {
  encode(row: Row): ThreadEventRecord {
    return {
      id: row.id as string,
      tid: row.tid as string,
      seq: row.seq as number,
      kind: row.kind as string,
      timestamp: Number(row.timestamp),
      data: parsejson<Record<string, unknown>>(row.data),
      metadata: parsejson<Record<string, unknown>>(row.metadata),
    } as ThreadEventRecord;
  },

  decode(): Row {
    throw new Error("RowToEventRecordDirect.decode not implemented");
  },
};
