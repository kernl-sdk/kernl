/**
 * Sleep system toolkit.
 * /packages/kernl/src/tool/sys/sleep.ts
 */

import assert from "assert";
import { z } from "zod";

import { randomID } from "@kernl-sdk/shared/lib";

import { tool } from "../tool";
import { Toolkit } from "../toolkit";

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
      .optional()
      .describe("Optional human-readable reason for the sleep."),
  })
  .refine(
    (v) => (v.delay_s ?? null) !== null || (v.run_at_s ?? null) !== null,
    {
      message: "Either delay_s or run_at_s must be provided",
      path: ["delay_s"],
    },
  );

const wait = tool({
  id: "wait_until",
  description:
    "Pause this agent until a future time. The thread will be resumed automatically.",
  mode: "async" as const,
  parameters: WaitParamsSchema,

  // NOTE: we rely on execute(), not requiresApproval, so the tool
  // ends up with state=COMPLETED (green) in the UI.
  //
  // This function:
  //   1) Schedules the wakeup in storage.
  //   2) Returns metadata so the UI can render a 'Sleeping' success state.
  execute: async (ctx, params) => {
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

    await wakeupStore.create({
      id: `wkp_${randomID()}`,
      threadId: ctx.threadId,
      runAt: targetRunAt_ms,
      reason: reason ?? null,
    });

    // This object becomes the `result` in the tool-result event.
    // The UI can key off `status: "sleeping"` to show a green "Sleeping" badge.
    return {
      status: "sleeping",
      scheduled: true,
      run_at_s: targetRunAt_s,
      run_at_ms: targetRunAt_ms,
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
