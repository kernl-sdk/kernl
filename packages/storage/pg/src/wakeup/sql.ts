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

    if (patch.runAt !== undefined) {
      sets.push(`run_at_s = $${idx++}`);
      params.push(Math.floor(patch.runAt / 1000));
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

    // Always bump updated_at in ms, matching memory's PATCH behavior.
    const nowMs = patch.updatedAt ?? Date.now();
    sets.push(`updated_at = $${idx++}`);
    params.push(nowMs);

    return {
      sql: sets.join(", "),
      params,
    };
  },

  decode() {
    throw new Error("PATCH.decode not implemented");
  },
};
