/**
 * Wakeup codecs.
 * /packages/storage/pg/src/wakeup/codec.ts
 */

import type { Codec } from "@kernl-sdk/shared/lib";

import type {
  ScheduledWakeupRecord,
} from "@kernl-sdk/storage";

import type {
  NewScheduledWakeup,
  ScheduledWakeup,
} from "kernl";

/**
 * Convert NewScheduledWakeup (domain) -> ScheduledWakeupRecord (DB).
 */
export const NewScheduledWakeupCodec: Codec<
  NewScheduledWakeup,
  ScheduledWakeupRecord
> = {
  encode(input) {
    const nowMs = Date.now();
    const runAtS = Math.floor(input.runAt / 1000);

    return {
      id: input.id,
      thread_id: input.threadId,
      run_at_s: runAtS,
      reason: input.reason ?? null,
      woken: false,
      claimed_at_s: null,
      created_at: nowMs,
      updated_at: nowMs,
      error: null,
    };
  },

  decode() {
    throw new Error("NewScheduledWakeupCodec.decode not implemented");
  },
};

/**
 * Convert between ScheduledWakeup (domain) and ScheduledWakeupRecord (DB).
 */
export const ScheduledWakeupCodec: Codec<
  ScheduledWakeup,
  ScheduledWakeupRecord
> = {
  encode(wakeup) {
    const runAtS = Math.floor(wakeup.runAt / 1000);
    const claimedAtS =
      wakeup.claimedAt != null ? Math.floor(wakeup.claimedAt / 1000) : null;

    return {
      id: wakeup.id,
      thread_id: wakeup.threadId,
      run_at_s: runAtS,
      reason: wakeup.reason,
      woken: wakeup.woken,
      claimed_at_s: claimedAtS,
      created_at: wakeup.createdAt,
      updated_at: wakeup.updatedAt,
      error: wakeup.error,
    };
  },

  decode(record) {
    return {
      id: record.id,
      threadId: record.thread_id,
      runAt: record.run_at_s * 1000,
      reason: record.reason,
      woken: record.woken,
      claimedAt:
        record.claimed_at_s != null ? record.claimed_at_s * 1000 : null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      error: record.error,
    };
  },
};
