/**
 * Wakeup Scheduler
 * /packages/kernl/src/scheduler/scheduler.ts
 *
 * Polls the wakeup store for due wakeups and resumes threads.
 * Can be attached to a Kernl instance or run standalone.
 */

import type { Kernl } from "@/kernl";
import type { ScheduledWakeup } from "@/wakeup";
import { getLogger } from "@/lib/logger";

import type { WakeupSchedulerOptions, WakeupSchedulerState } from "./types";

const logger = getLogger("kernl:scheduler");

const DEFAULT_INTERVAL_MS = 30_000; // 30 seconds
const DEFAULT_BATCH_SIZE = 10;

export class WakeupScheduler {
  private readonly kernl: Kernl;
  private readonly intervalMs: number;
  private readonly batchSize: number;

  private timer: ReturnType<typeof setInterval> | null = null;
  private polling = false; // guard against overlapping polls

  private _state: WakeupSchedulerState = {
    running: false,
    processed: 0,
    failed: 0,
    lastPollAt: null,
  };

  constructor(kernl: Kernl, options: WakeupSchedulerOptions = {}) {
    this.kernl = kernl;
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

    if (options.autoStart) {
      this.start();
    }
  }

  /**
   * Current scheduler state (read-only snapshot).
   */
  get state(): Readonly<WakeupSchedulerState> {
    return { ...this._state };
  }

  /**
   * Start the polling loop.
   * No-op if already running.
   */
  start(): void {
    if (this._state.running) {
      logger.warn("scheduler already running");
      return;
    }

    logger.info({ intervalMs: this.intervalMs }, "scheduler starting");
    this._state.running = true;

    // Run first poll immediately, then on interval
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  /**
   * Stop the polling loop.
   * In-flight poll will complete but no new polls will start.
   */
  stop(): void {
    if (!this._state.running) {
      logger.warn("scheduler not running");
      return;
    }

    logger.info("scheduler stopping");
    this._state.running = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Execute a single poll iteration.
   * Claims due wakeups and resumes their threads.
   *
   * Can be called manually for testing or one-off processing.
   */
  async poll(): Promise<void> {
    // Guard against overlapping polls (previous poll still running)
    if (this.polling) {
      logger.debug("skipping poll, previous poll still running");
      return;
    }

    this.polling = true;
    this._state.lastPollAt = Date.now();

    try {
      const wakeupStore = this.kernl.storage?.wakeups;
      if (!wakeupStore) {
        logger.warn("no wakeup store configured, skipping poll");
        return;
      }

      const nowMs = Date.now();
      const claimed = await wakeupStore.claimDue(nowMs, this.batchSize);

      if (claimed.length === 0) {
        logger.debug("no due wakeups found");
        return;
      }

      logger.info({ count: claimed.length }, "claimed due wakeups");

      // Process each wakeup
      await Promise.all(claimed.map((wakeup) => this.processWakeup(wakeup)));
    } catch (err) {
      logger.error({ err }, "poll failed");
    } finally {
      this.polling = false;
    }
  }

  /**
   * Process a single wakeup: resume the thread and mark wakeup as woken.
   */
  private async processWakeup(wakeup: ScheduledWakeup): Promise<void> {
    const { id, threadId } = wakeup;
    const wakeupStore = this.kernl.storage?.wakeups;
    const threadStore = this.kernl.storage?.threads;

    if (!wakeupStore || !threadStore) {
      logger.error({ wakeupId: id }, "storage not configured");
      return;
    }

    try {
      logger.debug({ wakeupId: id, threadId }, "processing wakeup");

      // Load thread with history
      const thread = await threadStore.get(threadId, { history: true });

      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // Resume thread execution (thread.execute continues from where it left off)
      await this.kernl.schedule(thread);

      // Mark wakeup as complete
      await wakeupStore.update(id, {
        id,
        woken: true,
        updatedAt: Date.now(),
      });

      this._state.processed++;
      logger.info({ wakeupId: id, threadId }, "wakeup processed successfully");
    } catch (err) {
      this._state.failed++;
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({ wakeupId: id, threadId, err: errorMsg }, "wakeup processing failed");

      // Record error on the wakeup record
      try {
        await wakeupStore.update(id, {
          id,
          error: errorMsg,
          updatedAt: Date.now(),
        });
      } catch (updateErr) {
        logger.error({ wakeupId: id, err: updateErr }, "failed to update wakeup with error");
      }
    }
  }
}
