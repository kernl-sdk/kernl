/**
 * Wakeup system toolkit.
 * /packages/kernl/src/tool/sys/wakeup.ts
 *
 * Provides a tool for agents to schedule a wakeup (sleep/wait) for the current thread.
 *
 * The thread runtime is responsible for:
 *   - Passing the current thread_id into this tool's parameters.
 *   - Using the async/INTERRUPTIBLE tool state to checkpoint/save and stop the thread.
 */

import assert from "assert";
import { z } from "zod";

import { randomID } from "@kernl-sdk/shared/lib";

import { tool } from "../tool";
import { Toolkit } from "../toolkit";

/**
 * Parameters for the wait tool.
 *
 * The runtime must pass:
 *  - thread_id: the id of the thread to resume later
 * And either:
 *  - delay_s: number of seconds from now, OR
 *  - run_at_s: absolute epoch seconds when the thread should resume
 */
const WaitParamsSchema = z
  .object({
    thread_id: z
      .string()
      .min(1)
      .describe("The id of the current thread to resume later."),
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
 * Schedules a wakeup for the given thread_id and then causes the tool call
 * to be INTERRUPTIBLE (via requiresApproval). The actual checkpoint/save/stop
 * behaviour is handled by the existing async tool + thread runtime.
 */
const wait = tool({
  id: "wait_until",
  description:
    "Pause this agent until a future time by scheduling a wakeup for the given thread.",
  mode: "async" as const,
  parameters: WaitParamsSchema,

  /**
   * We do the scheduling here and return true so the tool call becomes
   * INTERRUPTIBLE and execute() is not run until some future approval/resume.
   */
  requiresApproval: async (ctx, params) => {
    assert(ctx.agent, "ctx.agent is required for wakeup tools");

    const { thread_id, delay_s, run_at_s, reason } = params as z.infer<
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
    //   - threadId: camelCase
    //   - runAt: epoch milliseconds
    await wakeupStore.create({
      id: `wkp_${randomID()}`,
      threadId: thread_id,
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

export const wakeup = new Toolkit({
  id: "sys.wakeup",
  description: "Tools for scheduling and managing agent wakeups.",
  tools: [wait],
});
