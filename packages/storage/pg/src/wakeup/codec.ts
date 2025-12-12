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
    // Store timestamps in epoch *seconds* to keep the DB representation stable.
    const nowS = Math.floor(Date.now() / 1000);

    // Back-compat: allow either `sleepFor` (seconds) or legacy `runAt` (ms epoch).
    const anyInput = input as any;
    const sleepForS =
      typeof anyInput.sleepFor === "number"
        ? Math.max(0, Math.floor(anyInput.sleepFor))
        : Math.max(0, Math.floor(anyInput.runAt / 1000) - nowS);

    const wakeupAtS = nowS + sleepForS;

    return {
      id: input.id,
      thread_id: input.threadId,
      sleep_for: sleepForS,
      wakeup_at: wakeupAtS,
      reason: input.reason ?? null,
      woken: false,
      claimed_at_s: null,
      created_at: nowS,
      updated_at: nowS,
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
    const anyWakeup = wakeup as any;

    const wakeupAtMs = anyWakeup.wakeupAt ?? anyWakeup.runAt;
    const wakeupAtS = Math.floor(wakeupAtMs / 1000);

    // Domain timestamps are typically ms; DB stores seconds.
    const createdAtS =
      typeof anyWakeup.createdAt === "number"
        ? Math.floor(anyWakeup.createdAt / 1000)
        : wakeupAtS;

    const updatedAtS =
      typeof anyWakeup.updatedAt === "number"
        ? Math.floor(anyWakeup.updatedAt / 1000)
        : createdAtS;

    const sleepForS =
      typeof anyWakeup.sleepFor === "number"
        ? Math.max(0, Math.floor(anyWakeup.sleepFor))
        : Math.max(0, wakeupAtS - createdAtS);

    const claimedAtS =
      anyWakeup.claimedAt != null ? Math.floor(anyWakeup.claimedAt / 1000) : null;

    return {
      id: wakeup.id,
      thread_id: wakeup.threadId,
      sleep_for: sleepForS,
      wakeup_at: wakeupAtS,
      reason: wakeup.reason,
      woken: wakeup.woken,
      claimed_at_s: claimedAtS,
      created_at: createdAtS,
      updated_at: updatedAtS,
      error: wakeup.error,
    };
  },

  decode(record) {
    return {
      id: record.id,
      threadId: record.thread_id,
      // Back-compat: expose legacy `runAt` in ms while the DB stores seconds.
      runAt: record.wakeup_at * 1000,
      // New: also expose the stored duration (seconds).
      sleepFor: record.sleep_for,
      reason: record.reason,
      woken: record.woken,
      claimedAt:
        record.claimed_at_s != null ? record.claimed_at_s * 1000 : null,
      createdAt: record.created_at * 1000,
      updatedAt: record.updated_at * 1000,
      error: record.error,
    };
  },
};
