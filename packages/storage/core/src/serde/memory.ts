/**
 * Memory serialization - codecs for converting between domain types and database records.
 */

import type { MemoryRecord, NewMemory, MemoryByte } from "kernl";
import type { JSONObject } from "@kernl-sdk/protocol";
import { type Codec, neapolitanCodec } from "@kernl-sdk/shared/lib";

import { MemoryDBRecordSchema, type MemoryDBRecord } from "@/memory/schema";

/* ---- Codecs ---- */

/**
 * MemoryRecord codec - converts between domain MemoryRecord and MemoryDBRecord.
 */
const rawMemoryRecordCodec: Codec<MemoryRecord, MemoryDBRecord> = {
  encode(record: MemoryRecord): MemoryDBRecord {
    return {
      id: record.id,
      namespace: record.scope.namespace ?? null,
      entity_id: record.scope.entityId ?? null,
      agent_id: record.scope.agentId ?? null,
      collection: record.collection,
      content: record.content,
      wmem: record.wmem,
      smem_expires_at: record.smemExpiresAt,
      timestamp: record.timestamp,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      metadata: record.metadata,
    };
  },

  decode(row: MemoryDBRecord): MemoryRecord {
    return {
      id: row.id,
      scope: {
        namespace: row.namespace ?? undefined,
        entityId: row.entity_id ?? undefined,
        agentId: row.agent_id ?? undefined,
      },
      collection: row.collection,
      content: row.content as MemoryByte,
      wmem: row.wmem,
      smemExpiresAt: row.smem_expires_at ? Number(row.smem_expires_at) : null, // pg returns BIGINT as string
      timestamp: Number(row.timestamp), // pg returns BIGINT as string
      createdAt: Number(row.created_at), // pg returns BIGINT as string
      updatedAt: Number(row.updated_at), // pg returns BIGINT as string
      metadata: row.metadata as JSONObject | null,
    };
  },
};

export const MemoryRecordCodec = neapolitanCodec({
  codec: rawMemoryRecordCodec,
  schema: MemoryDBRecordSchema,
});

/**
 * NewMemory codec - converts NewMemory input to MemoryDBRecord for insertion.
 */
const rawNewMemoryCodec: Codec<NewMemory, MemoryDBRecord> = {
  encode(memory: NewMemory): MemoryDBRecord {
    const now = Date.now();
    return {
      id: memory.id,
      namespace: memory.scope.namespace ?? null,
      entity_id: memory.scope.entityId ?? null,
      agent_id: memory.scope.agentId ?? null,
      collection: memory.collection,
      content: memory.content,
      wmem: memory.wmem ?? false,
      smem_expires_at: memory.smemExpiresAt ?? null,
      timestamp: memory.timestamp ?? now,
      created_at: now,
      updated_at: now,
      metadata: memory.metadata ?? null,
    };
  },

  decode(row: MemoryDBRecord): NewMemory {
    return {
      id: row.id,
      scope: {
        namespace: row.namespace ?? undefined,
        entityId: row.entity_id ?? undefined,
        agentId: row.agent_id ?? undefined,
      },
      collection: row.collection,
      content: row.content as MemoryByte,
      wmem: row.wmem,
      smemExpiresAt: row.smem_expires_at ? Number(row.smem_expires_at) : null, // pg returns BIGINT as string
      timestamp: Number(row.timestamp), // pg returns BIGINT as string
      metadata: row.metadata as JSONObject | null | undefined,
    };
  },
};

export const NewMemoryCodec = neapolitanCodec({
  codec: rawNewMemoryCodec,
  schema: MemoryDBRecordSchema,
});
