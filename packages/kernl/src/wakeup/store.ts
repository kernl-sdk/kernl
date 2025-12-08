/**
 * Wakeup store contract.
 * /packages/kernl/src/wakeup/store.ts
 */

import type {
  NewScheduledWakeup,
  ScheduledWakeup,
  ScheduledWakeupUpdate,
} from "./types";

/**
 * Persistence contract for scheduled wakeups.
 *
 * Implementations live in provider packages (e.g. @kernl-sdk/storage/pg).
 */
export interface WakeupStore {
  /**
   * Create a new scheduled wakeup.
   */
  create(wakeup: NewScheduledWakeup): Promise<ScheduledWakeup>;

  /**
   * Get a wakeup by ID.
   */
  get(id: string): Promise<ScheduledWakeup | null>;

  /**
   * Update an existing wakeup.
   */
  update(id: string, patch: ScheduledWakeupUpdate): Promise<ScheduledWakeup>;

  /**
   * Delete a wakeup (admin/cleanup). Normal flow should mark `woken = true`
   * instead of deleting.
   */
  delete(id: string): Promise<void>;

  /**
   * Atomically claim up to `limit` due wakeups.
   *
   * A wakeup is "due" when:
   *  - woken = false
   *  - claimedAt is null
   *  - runAt <= nowMs
   *
   * Implementations must be safe under multiple pollers
   * (e.g. using SKIP LOCKED semantics).
   */
  claimDue(nowMs: number | bigint, limit: number): Promise<ScheduledWakeup[]>;
}
