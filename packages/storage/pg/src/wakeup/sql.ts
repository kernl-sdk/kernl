/**
 * Wakeup SQL conversion codecs.
 * /packages/storage/pg/src/wakeup/sql.ts
 */

import type { Codec } from "@kernl-sdk/shared/lib";
import type { ScheduledWakeupUpdate } from "kernl";

export interface SQLClause {
  sql: string;
  params: unknown[];
}

/**
 * Input for building a partial UPDATE ... SET clause.
 */
export interface PatchInput {
  patch: ScheduledWakeupUpdate;
  startIdx: number;
}

/**
 * Build `SET ...` clause for scheduled_wakeups updates.
 *
 * Mirrors the style of /packages/storage/pg/src/memory/sql.ts::PATCH
 */
export const PATCH: Codec<PatchInput, SQLClause> = {
  encode({ patch, startIdx }) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = startIdx;

    // Back-compat: allow either `wakeupAt` (ms), legacy `runAt` (ms), and/or `sleepFor` (seconds).
    const anyPatch = patch as any;
    const wakeupAtMs = anyPatch.wakeupAt ?? anyPatch.runAt;

    if (wakeupAtMs !== undefined) {
      const wakeupAtS = Math.floor(wakeupAtMs / 1000);
      const wakeupIdx = idx++;
      sets.push(`wakeup_at = $${wakeupIdx}`);
      params.push(wakeupAtS);

      // If caller did not explicitly set sleepFor, keep it consistent with wakeup_at and created_at.
      if (anyPatch.sleepFor === undefined) {
        sets.push(`sleep_for = GREATEST(0, $${wakeupIdx} - created_at)`);
      }
    }

    if (anyPatch.sleepFor !== undefined) {
      sets.push(`sleep_for = $${idx++}`);
      params.push(Math.max(0, Math.floor(anyPatch.sleepFor)));
    }

    if (patch.reason !== undefined) {
      sets.push(`reason = $${idx++}`);
      params.push(patch.reason);
    }

    if (patch.woken !== undefined) {
      sets.push(`woken = $${idx++}`);
      params.push(patch.woken);
    }

    if (patch.claimedAt !== undefined) {
      sets.push(`claimed_at_s = $${idx++}`);
      params.push(
        patch.claimedAt != null ? Math.floor(patch.claimedAt / 1000) : null,
      );
    }

    if (patch.error !== undefined) {
      sets.push(`error = $${idx++}`);
      params.push(patch.error);
    }

    // Always bump updated_at in epoch seconds.
    const nowS = Math.floor(((patch as any).updatedAt ?? Date.now()) / 1000);
    sets.push(`updated_at = $${idx++}`);
    params.push(nowS);

    return {
      sql: sets.join(", "),
      params,
    };
  },

  decode() {
    throw new Error("PATCH.decode not implemented");
  },
};
