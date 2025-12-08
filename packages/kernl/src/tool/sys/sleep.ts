/**
 * Sleep system toolkit.
 * /packages/kernl/src/tool/sys/sleep.ts
 *
 * Provides a tool for agents to sleep (pause) and schedule a wakeup for the current thread.
 *
 * The thread runtime provides threadId via ctx.threadId automatically.
 */

import assert from "assert";
import { z } from "zod";

import { randomID } from "@kernl-sdk/shared/lib";

import { tool } from "../tool";
import { Toolkit } from "../toolkit";

/**
 * Parameters for the wait tool.
 *
 * Either:
 *  - delay_s: number of seconds from now, OR
 *  - run_at_s: absolute epoch seconds when the thread should resume
 */
const WaitParamsSchema = z
  .object({
    delay_s: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe(
        "How many seconds from now to wait before resuming this thread.",
      ),
    run_at_s: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Exact epoch seconds when this thread should be resumed."),
    reason: z
      .string()
      .max(512)
      .optional()
      .describe("Optional human-readable reason for the wakeup."),
  })
  .refine(
    (v) => (v.delay_s ?? null) !== null || (v.run_at_s ?? null) !== null,
    {
      message: "Either delay_s or run_at_s must be provided",
      path: ["delay_s"],
    },
  );

/**
 * wait_until
 *
 * Schedules a wakeup for the current thread and then causes the tool call
 * to be INTERRUPTIBLE (via requiresApproval). The actual checkpoint/save/stop
 * behaviour is handled by the existing async tool + thread runtime.
 */
const wait = tool({
  id: "wait_until",
  description:
    "Pause this agent until a future time. The thread will be resumed automatically.",
  mode: "async" as const,
  parameters: WaitParamsSchema,

  /**
   * We do the scheduling here and return true so the tool call becomes
   * INTERRUPTIBLE and execute() is not run until some future approval/resume.
   */
  requiresApproval: async (ctx, params) => {
    assert(ctx.agent, "ctx.agent is required for sleep tools");
    assert(ctx.threadId, "ctx.threadId is required for sleep tools");

    const { delay_s, run_at_s, reason } = params as z.infer<
      typeof WaitParamsSchema
    >;

    const agent: any = ctx.agent;

    if (!agent.kernl || !agent.kernl.storage) {
      throw new Error("Agent is not bound to Kernl storage.");
    }

    const wakeupStore: any = agent.kernl.storage.wakeups;
    if (!wakeupStore || typeof wakeupStore.create !== "function") {
      throw new Error("Wakeup store is not configured on Kernl storage.");
    }

    const now_s = Math.floor(Date.now() / 1000);
    const targetRunAt_s =
      run_at_s ?? (delay_s !== undefined ? now_s + delay_s : now_s);
    const targetRunAt_ms = targetRunAt_s * 1000;

    // Create the scheduled wakeup record.
    // Field names and units must match NewScheduledWakeup domain type:
    //   - id: unique wakeup ID (generated here)
    //   - threadId: from context (set by thread runtime)
    //   - runAt: epoch milliseconds
    await wakeupStore.create({
      id: `wkp_${randomID()}`,
      threadId: ctx.threadId,
      runAt: targetRunAt_ms,
      reason: reason ?? null,
    });

    // Returning true tells the tool engine this call requires approval,
    // so it will mark the tool call as INTERRUPTIBLE and *not* run execute()
    // until a scheduler/poller resumes/approves it.
    return true;
  },

  /**
   * execute() is only expected to run if/when the tool call is explicitly
   * approved/resumed by your scheduler. For now it just returns a simple
   * acknowledgement.
   */
  execute: async () => {
    return {
      scheduled: true,
      message:
        "Wakeup scheduled; the thread will resume when the wakeup is processed.",
    };
  },
});

// --- Toolkit ---

export const sleep = new Toolkit({
  id: "sys.sleep",
  description: "Tools for pausing agents and scheduling wakeups.",
  tools: [wait],
});
