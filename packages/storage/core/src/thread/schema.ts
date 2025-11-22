/**
 * Thread record schemas and table definitions.
 */

import { z } from "zod";
import { THREAD_STATES } from "@kernl-sdk/core";
import { text, jsonb, bigint, integer, timestamps, defineTable } from "@/table";

/* ---- Table Definitions ---- */

/**
 * Threads table schema.
 */
export const TABLE_THREADS = defineTable(
  "threads",
  {
    id: text().primaryKey(),
    agent_id: text(),
    model: text(),
    context: jsonb(),
    parent_task_id: text().nullable(),
    tick: integer().default(0),
    state: text(),
    metadata: jsonb().nullable(),
    ...timestamps,
  },
  [
    { kind: "index", columns: ["state"] },
    { kind: "index", columns: ["agent_id"] },
    { kind: "index", columns: ["parent_task_id"] },
    { kind: "index", columns: ["created_at"] },
    { kind: "index", columns: ["updated_at"] },
  ],
);

/**
 * Thread events table schema.
 */
export const TABLE_THREAD_EVENTS = defineTable(
  "thread_events",
  {
    id: text(),
    tid: text().references(() => TABLE_THREADS.columns.id, {
      onDelete: "CASCADE",
    }),
    seq: integer(),
    kind: text(),
    timestamp: bigint(),
    data: jsonb().nullable(),
    metadata: jsonb().nullable(),
  },
  [
    {
      kind: "unique",
      columns: ["tid", "id"],
    },
    { kind: "index", columns: ["tid", "seq"] }, // for ordering events within a thread
    { kind: "index", columns: ["tid", "kind"] }, // for filtering by thread + kind
  ],
);

/**
 * Migrations table.
 */
export const TABLE_MIGRATIONS = defineTable("migrations", {
  id: text().primaryKey(),
  applied_at: bigint(),
});

/* ---- Record Schemas ---- */

/**
 * Thread record schema (zod-first).
 */
export const ThreadRecordSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  model: z.string(), // composite: "provider/modelId"
  context: z.unknown(), // JSONB - Context<TContext>
  parent_task_id: z.string().nullable(),
  tick: z.number().int().nonnegative(),
  state: z.enum(THREAD_STATES),
  created_at: z.number().int(),
  updated_at: z.number().int(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type ThreadRecord = z.infer<typeof ThreadRecordSchema>;

/**
 * Thread event inner data - stored in JSONB column.
 *
 * Always an object (record) for non-system events. Inner data is validated by protocol layer
 * and is already JSON-serializable. The actual structure depends on the event kind:
 * - message: {role, content, ...}
 * - tool-call: {callId, toolId, state, arguments}
 * - tool-result: {callId, toolId, state, result, error}
 * - reasoning: {text}
 * - system: null (handled separately)
 */
export const ThreadEventInnerSchema = z.record(z.string(), z.unknown());

export type ThreadEventInner = z.infer<typeof ThreadEventInnerSchema>;

/**
 * Thread event record base schema - common fields for all events.
 */
const ThreadEventRecordBaseSchema = z.object({
  id: z.string(),
  tid: z.string(),
  seq: z.number().int().nonnegative(),
  timestamp: z.number().int(), // epoch millis
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

/**
 * Message event record (user, assistant, system messages).
 */
const ThreadMessageEventRecordSchema = ThreadEventRecordBaseSchema.extend({
  kind: z.literal("message"),
  data: ThreadEventInnerSchema, // Message data: {role, content, ...}
});

/**
 * Reasoning event record.
 */
const ThreadReasoningEventRecordSchema = ThreadEventRecordBaseSchema.extend({
  kind: z.literal("reasoning"),
  data: ThreadEventInnerSchema, // Reasoning data: {text}
});

/**
 * Tool call event record.
 */
const ThreadToolCallEventRecordSchema = ThreadEventRecordBaseSchema.extend({
  kind: z.literal("tool-call"),
  data: ThreadEventInnerSchema, // ToolCall data: {callId, toolId, state, arguments}
});

/**
 * Tool result event record.
 */
const ThreadToolResultEventRecordSchema = ThreadEventRecordBaseSchema.extend({
  kind: z.literal("tool-result"),
  data: ThreadEventInnerSchema, // ToolResult data: {callId, toolId, state, result, error}
});

/**
 * System event record - runtime state changes (not sent to model).
 */
const ThreadSystemEventRecordSchema = ThreadEventRecordBaseSchema.extend({
  kind: z.literal("system"),
  data: z.null(), // System events have no data
});

/**
 * Thread event record schema (discriminated union by kind).
 */
export const ThreadEventRecordSchema = z.discriminatedUnion("kind", [
  ThreadMessageEventRecordSchema,
  ThreadReasoningEventRecordSchema,
  ThreadToolCallEventRecordSchema,
  ThreadToolResultEventRecordSchema,
  ThreadSystemEventRecordSchema,
]);

export type ThreadEventRecord = z.infer<typeof ThreadEventRecordSchema>;
