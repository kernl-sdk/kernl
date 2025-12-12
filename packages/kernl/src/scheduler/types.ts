/**
 * Scheduler Types
 * /packages/kernl/src/scheduler/types.ts
 */

export interface WakeupSchedulerOptions {
  /**
   * Polling interval in milliseconds.
   * @default 30000 (30 seconds)
   */
  intervalMs?: number;

  /**
   * Maximum number of wakeups to claim per poll.
   * @default 10
   */
  batchSize?: number;

  /**
   * Whether to start polling automatically when the scheduler is created.
   * @default false
   */
  autoStart?: boolean;
}

export interface WakeupSchedulerState {
  /** Whether the scheduler is currently polling */
  running: boolean;

  /** Number of wakeups processed since start */
  processed: number;

  /** Number of wakeups that failed to process */
  failed: number;

  /** Timestamp of last poll (epoch ms), null if never polled */
  lastPollAt: number | null;
}
