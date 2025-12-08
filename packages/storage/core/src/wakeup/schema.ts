/**
 * /packages/storage/core/src/wakeup/schema.ts
 *
 * First implementation:
 * - run_at_s: epoch seconds when the wakeup becomes due
 * - woken: consumed/completed
 * - claimed_at_s: set when a poller claims it to avoid double-processing
 */

import { z } from "zod";

import { text, bigint, boolean, timestamps, defineTable } from "@/table";
import { TABLE_THREADS } from "@/thread/schema";

export const TABLE_SCHEDULED_WAKEUPS = defineTable(
  "scheduled_wakeups",
  {
    id: text().primaryKey(),

    thread_id: text().references(() => TABLE_THREADS.columns.id, {
      onDelete: "CASCADE",
    }),

    // Due time (epoch seconds)
    run_at_s: bigint(),

    reason: text().nullable(),

    // Consumed/completed
    woken: boolean().default(false),

    // Claimed by a poller (epoch seconds); nullable means unclaimed
    claimed_at_s: bigint().nullable(),

    ...timestamps,

    error: text().nullable(),
  },
  [
    // Polling query: woken=false AND claimed_at_s IS NULL AND run_at_s <= now
    { kind: "index", columns: ["woken", "run_at_s"] },
    { kind: "index", columns: ["thread_id"] },
    { kind: "index", columns: ["claimed_at_s"] },
  ],
);

const epochSeconds = z.coerce.number().int().nonnegative();

export const ScheduledWakeupRecordSchema = z.object({
  id: z.string(),
  thread_id: z.string(),

  run_at_s: epochSeconds,
  reason: z.string().nullable(),

  woken: z.boolean(),
  claimed_at_s: epochSeconds.nullable(),

  created_at: epochSeconds,
  updated_at: epochSeconds,

  error: z.string().nullable(),
});

export type ScheduledWakeupRecord = z.infer<typeof ScheduledWakeupRecordSchema>;
