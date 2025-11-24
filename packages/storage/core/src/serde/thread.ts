/**
 * Thread serialization - codecs for converting between domain types and database records.
 */

import { type Codec, neapolitanCodec } from "@kernl-sdk/shared/lib";
import type { IThread, ThreadEvent } from "@kernl-sdk/core/internal";
import { STOPPED } from "@kernl-sdk/protocol";

import type { ThreadRecord, ThreadEventRecord } from "@/thread/schema";
import { ThreadRecordSchema, ThreadEventRecordSchema } from "@/thread/schema";
import type { NewThread } from "@/thread/types";

/**
 * Decoded thread record - validated but not hydrated.
 *
 * Has all IThread fields except:
 * - agent/model are replaced with agentId/model (string references)
 * - input/history/task are not included (loaded separately, task becomes parentTaskId)
 * - context is raw JSONB data (needs reconstruction into Context instance)
 */
export type DecodedThread = Omit<
  IThread,
  "agent" | "model" | "input" | "history" | "task" | "context"
> & {
  namespace: string;
  agentId: string;
  model: string; // composite: "provider/modelId"
  parentTaskId: string | null; // stored task reference
  context: unknown; // raw JSONB - reconstruct with new Context(data)
};

/* ---- Codecs ---- */

/**
 * Thread codec - converts between DecodedThread and ThreadRecord.
 */
const rawThreadCodec: Codec<DecodedThread, ThreadRecord> = {
  encode(decoded: DecodedThread): ThreadRecord {
    return {
      id: decoded.tid,
      namespace: decoded.namespace,
      agent_id: decoded.agentId,
      model: decoded.model,
      parent_task_id: decoded.parentTaskId,
      context: decoded.context,
      tick: decoded.tick,
      state: decoded.state,
      created_at: decoded.createdAt.getTime(),
      updated_at: decoded.updatedAt.getTime(),
      metadata: decoded.metadata,
    };
  },

  decode(record: ThreadRecord): DecodedThread {
    return {
      tid: record.id,
      namespace: record.namespace,
      agentId: record.agent_id,
      model: record.model,
      parentTaskId: record.parent_task_id,
      context: record.context,
      tick: record.tick,
      state: record.state,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      metadata: record.metadata,
    };
  },
};

export const ThreadCodec = neapolitanCodec({
  codec: rawThreadCodec,
  schema: ThreadRecordSchema,
});

/**
 * ThreadEvent codec - converts between flat ThreadEvent and ThreadEventRecord.
 *
 * App layer: {kind, ...dataFields, id, tid, seq, timestamp, metadata}
 * DB layer:  {kind, data: {...dataFields}, id, tid, seq, timestamp, metadata}
 */
const rawThreadEventCodec: Codec<ThreadEvent, ThreadEventRecord> = {
  encode(event: ThreadEvent): ThreadEventRecord {
    const base = {
      id: event.id,
      tid: event.tid,
      seq: event.seq,
      timestamp: event.timestamp.getTime(),
      metadata: event.metadata ?? null,
    };

    // System events have no data
    if (event.kind === "system") {
      return { ...base, kind: "system", data: null };
    }

    // Extract data (everything except base fields and kind)
    const { id, tid, seq, timestamp, metadata, kind, ...data } = event as any;

    return {
      ...base,
      kind: event.kind,
      data,
    };
  },

  decode(record: ThreadEventRecord): ThreadEvent {
    const base = {
      id: record.id,
      tid: record.tid,
      seq: record.seq,
      timestamp: new Date(record.timestamp),
      metadata: record.metadata ?? {},
    };

    // System events have no data
    if (record.kind === "system") {
      return { ...base, kind: "system" };
    }

    // For non-system events, data is always a record (enforced by schema)
    return {
      ...base,
      kind: record.kind,
      ...record.data,
    } as ThreadEvent;
  },
};

export const ThreadEventRecordCodec = neapolitanCodec({
  codec: rawThreadEventCodec,
  schema: ThreadEventRecordSchema,
});

/**
 * NewThread codec - converts NewThread input to ThreadRecord for insertion.
 *
 * Handles default values at encoding time (tick=0, state="stopped", timestamps=now).
 */
const rawNewThreadCodec: Codec<NewThread, ThreadRecord> = {
  encode(thread: NewThread): ThreadRecord {
    const now = Date.now();
    return {
      id: thread.id,
      namespace: thread.namespace,
      agent_id: thread.agentId,
      model: thread.model,
      context: thread.context ?? {},
      tick: thread.tick ?? 0,
      state: thread.state ?? STOPPED,
      parent_task_id: thread.parentTaskId ?? null,
      metadata: thread.metadata ?? null,
      created_at: thread.createdAt?.getTime() ?? now,
      updated_at: thread.updatedAt?.getTime() ?? now,
    };
  },

  decode(record: ThreadRecord): NewThread {
    return {
      id: record.id,
      namespace: record.namespace,
      agentId: record.agent_id,
      model: record.model,
      context: record.context,
      tick: record.tick,
      state: record.state,
      parentTaskId: record.parent_task_id,
      metadata: record.metadata,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  },
};

export const NewThreadCodec = neapolitanCodec({
  codec: rawNewThreadCodec,
  schema: ThreadRecordSchema,
});
