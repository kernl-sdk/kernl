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
    kind: text(), // "episodic" | "semantic"
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
    { kind: "index", columns: ["kind"] },
    { kind: "index", columns: ["collection"] },
    { kind: "index", columns: ["wmem"] },
    { kind: "index", columns: ["timestamp"] },
    { kind: "index", columns: ["created_at"] },
  ],
);

/* ---- Record Schema ---- */

const TextByteSchema = z.string();

// Binary data can be Uint8Array or base64/URI string
const BinaryDataSchema = z.union([
  z.custom<Uint8Array>((val) => val instanceof Uint8Array),
  z.string(),
]);

const ImageByteSchema = z.object({
  data: BinaryDataSchema,
  mime: z.string(),
  alt: z.string().optional(),
});

const AudioByteSchema = z.object({
  data: BinaryDataSchema,
  mime: z.string(),
});

const VideoByteSchema = z.object({
  data: BinaryDataSchema,
  mime: z.string(),
});

const MemoryByteSchema = z.object({
  text: TextByteSchema.optional(),
  image: ImageByteSchema.optional(),
  audio: AudioByteSchema.optional(),
  video: VideoByteSchema.optional(),
  object: z.record(z.string(), z.unknown()).optional(),
});

const MemoryKindSchema = z.enum(["episodic", "semantic"]);

// pg returns BIGINT as string, so we coerce to number
const pgBigint = z.coerce.number().int();

export const MemoryDBRecordSchema = z.object({
  id: z.string(),
  namespace: z.string().nullable(),
  entity_id: z.string().nullable(),
  agent_id: z.string().nullable(),
  kind: MemoryKindSchema,
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
