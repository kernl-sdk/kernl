/**
 * Memory table definition and record schema.
 */

import { z } from "zod";
import { text, bigint, boolean, jsonb, timestamps, defineTable } from "@/table";

/* ---- Table Definition ---- */

export const TABLE_MEMORIES = defineTable(
  "memories",
  {
    id: text().primaryKey(),
    namespace: text().nullable(),
    entity_id: text().nullable(),
    agent_id: text().nullable(),
    collection: text(),
    content: jsonb(),
    wmem: boolean().default(false),
    smem_expires_at: bigint().nullable(),
    timestamp: bigint(),
    ...timestamps,
    metadata: jsonb().nullable(),
  },
  [
    { kind: "index", columns: ["namespace"] },
    { kind: "index", columns: ["entity_id"] },
    { kind: "index", columns: ["agent_id"] },
    { kind: "index", columns: ["collection"] },
    { kind: "index", columns: ["wmem"] },
    { kind: "index", columns: ["timestamp"] },
    { kind: "index", columns: ["created_at"] },
  ],
);

/* ---- Record Schema ---- */

const MemoryByteSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("object"),
    value: z.record(z.string(), z.unknown()),
    summary: z.string().optional(),
  }),
]);

// pg returns BIGINT as string, so we coerce to number
const pgBigint = z.coerce.number().int();

export const MemoryDBRecordSchema = z.object({
  id: z.string(),
  namespace: z.string().nullable(),
  entity_id: z.string().nullable(),
  agent_id: z.string().nullable(),
  collection: z.string(),
  content: MemoryByteSchema,
  wmem: z.boolean(),
  smem_expires_at: pgBigint.nullable(),
  timestamp: pgBigint,
  created_at: pgBigint,
  updated_at: pgBigint,
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type MemoryDBRecord = z.infer<typeof MemoryDBRecordSchema>;
