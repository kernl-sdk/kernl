/**
 * /packages/storage/core/src/wakeup/schema.ts
 *
 * First implementation:
 * - wakeup_at: epoch seconds when the wakeup becomes due
 * - sleep_for: seconds to sleep (requested duration)
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

    // Requested duration (seconds)
    sleep_for: bigint(),

    // Due time (epoch seconds)
    wakeup_at: bigint(),

    reason: text().nullable(),

    // Consumed/completed
    woken: boolean().default(false),

    // Claimed by a poller (epoch seconds); nullable means unclaimed
    claimed_at_s: bigint().nullable(),

    ...timestamps,

    error: text().nullable(),
  },
  [
    // Polling query: woken=false AND claimed_at_s IS NULL AND wakeup_at <= now
    { kind: "index", columns: ["woken", "wakeup_at"] },
    { kind: "index", columns: ["thread_id"] },
    { kind: "index", columns: ["claimed_at_s"] },
  ],
);

const epochSeconds = z.coerce.number().int().nonnegative();

export const ScheduledWakeupRecordSchema = z.object({
  id: z.string(),
  thread_id: z.string(),

  sleep_for: epochSeconds,
  wakeup_at: epochSeconds,
  reason: z.string().nullable(),

  woken: z.boolean(),
  claimed_at_s: epochSeconds.nullable(),

  created_at: epochSeconds,
  updated_at: epochSeconds,

  error: z.string().nullable(),
});

export type ScheduledWakeupRecord = z.infer<typeof ScheduledWakeupRecordSchema>;
