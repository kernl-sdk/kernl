/**
 * Wakeup system toolkit.
 * /packages/kernl/src/tool/sys/wakeup.ts
 *
 * Provides a tool for agents to schedule a wakeup (sleep/wait) for the current thread.
 * The tool:
 *   - Creates a scheduled wakeup for the current thread
 *   - Returns INTERRUPTIBLE state so the thread can be stopped/checkpointed
 *
 * Enabled via a future `wakeup: true`-style config on the agent (parallel to memory).
 */

import assert from "assert";
import { z } from "zod";

import { tool } from "../tool";
import { Toolkit } from "../toolkit";

/**
 * Parameters for the wait tool.
 *
 * At least one of:
 *  - delay_s: number of seconds from now
 *  - run_at_s: absolute epoch seconds
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
 * to be INTERRUPTIBLE (via requiresApproval).
 *
 * Contract:
 *   - ctx.agent MUST exist.
 *   - ctx.agent.wakeups.scheduleForCurrentThread({ run_at_s, reason }) MUST exist and:
 *       - create a ScheduledWakeup row tied to the current thread id
 *       - use your WakeupStore + ScheduledWakeupRecord schema
 *
 * Tool engine behavior:
 *   - For async tools with requiresApproval:
 *       - if requiresApproval returns true, the engine treats the call as
 *         INTERRUPTIBLE and does not immediately run execute().
 *       - that is exactly what we want for "sleep": schedule + interrupt.
 */
const wait = tool({
  id: "wait_until",
  description:
    "Pause this agent until a future time by scheduling a wakeup for the current thread.",
  mode: "async" as const,
  parameters: WaitParamsSchema,

  requiresApproval: async (ctx, params) => {
    assert(ctx.agent, "ctx.agent required for wakeup tools");

    const { delay_s, run_at_s, reason } = params as z.infer<
      typeof WaitParamsSchema
    >;

    const now_s = Math.floor(Date.now() / 1000);
    const targetRunAt_s =
      run_at_s ?? (delay_s !== undefined ? now_s + delay_s : now_s);

    const agent: any = ctx.agent;

    if (
      !agent.wakeups ||
      typeof agent.wakeups.scheduleForCurrentThread !== "function"
    ) {
      throw new Error(
        "Expected ctx.agent.wakeups.scheduleForCurrentThread(...) to be available.",
      );
    }

    // Delegate to the agent-level wakeup service so we don't depend on
    // ctx.kernl or ctx.thread here.
    await agent.wakeups.scheduleForCurrentThread({
      run_at_s: targetRunAt_s,
      reason: reason ?? null,
    });

    // Returning true tells the tool engine:
    //   - this call requires approval
    //   - mark the tool call as INTERRUPTIBLE and *don't* run execute() yet
    return true;
  },

  /**
   * execute() is not expected to run before the wakeup.
   *
   * If you later implement a resume path that "approves" this tool call
   * (e.g. scheduler/poller marks it approved), execute() will run on resume.
   * For now, it just returns a small acknowledgement.
   */
  execute: async () => {
    return {
      scheduled: true,
      message:
        "Wakeup scheduled; thread will resume when the wakeup is processed.",
    };
  },
});

// --- Toolkit ---

/**
 * Wakeup system toolkit.
 *
 * Provides the wait_until tool for scheduling wakeups of the current thread.
 */
export const wakeup = new Toolkit({
  id: "sys.wakeup",
  description: "Tools for scheduling and managing agent wakeups.",
  tools: [wait],
});


// /**
//  * Wakeup system toolkit.
//  * /packages/kernl/src/tool/sys/wakeup.ts
//  *
//  * Provides a tool for agents to schedule a wakeup (sleep/wait) for the current thread.
//  * The tool:
//  *   - Creates a scheduled wakeup for the current thread
//  *   - Returns INTERRUPTIBLE state so the thread can be stopped/checkpointed
//  *
//  * Enabled via a future `wakeup: true`-style config on the agent (parallel to memory).
//  */

// import assert from "assert";
// import { z } from "zod";

// import { tool } from "../tool";
// import { Toolkit } from "../toolkit";

// /**
//  * Parameters for the wait tool:
//  * - delay_s: relative delay in seconds
//  * - run_at_s: absolute epoch seconds when the wakeup should fire
//  *
//  * Exactly one of delay_s or run_at_s must be provided.
//  */
// const WaitParamsSchema = z
//   .object({
//     delay_s: z
//       .number()
//       .int()
//       .nonnegative()
//       .optional()
//       .describe(
//         "How many seconds from now to wait before resuming this thread.",
//       ),

//     run_at_s: z
//       .number()
//       .int()
//       .nonnegative()
//       .optional()
//       .describe(
//         "Exact epoch seconds when this thread should be resumed. If provided, delay_s is ignored.",
//       ),

//     reason: z
//       .string()
//       .max(512)
//       .optional()
//       .describe("Optional human-readable reason for the wakeup."),
//   })
//   .refine(
//     (v) => (v.delay_s ?? null) !== null || (v.run_at_s ?? null) !== null,
//     {
//       message: "Either delay_s or run_at_s must be provided",
//       path: ["delay_s"],
//     },
//   )
//   .refine(
//     (v) => !((v.delay_s ?? null) !== null && (v.run_at_s ?? null) !== null),
//     {
//       message: "Provide either delay_s or run_at_s, but not both",
//       path: ["run_at_s"],
//     },
//   );

// /**
//  * Wait tool:
//  * - Schedules a wakeup for the current thread
//  * - Uses the approval path to return INTERRUPTIBLE, so the thread sleeps
//  *
//  * NOTE: The actual scheduling side-effect is performed inside `requiresApproval`,
//  *       so that the tool returns state=INTERRUPTIBLE *without* ever running execute().
//  */
// const wait = tool({
//   id: "wait_until",
//   description:
//     "Pause this agent until a future time by scheduling a wakeup for the current thread " +
//     "and suspending execution. Use this to 'sleep' and resume later.",

//   // This indicates the tool is conceptually async (long-running / external).
//   mode: "async" as const,

//   parameters: WaitParamsSchema,

//   /**
//    * Side-effect: schedule a wakeup and then return true so the tool call becomes INTERRUPTIBLE.
//    *
//    * We intentionally do the scheduling here (in requiresApproval) rather than in execute:
//    *   - If this returns true and there is no approval recorded, the FunctionTool
//    *     returns `{ state: INTERRUPTIBLE, result: undefined }` and *does not* call execute().
//    *   - That is exactly what we want for "sleep": schedule + interrupt.
//    *
//    * Expected environment contract (to wire WakeupStore):
//    *   - ctx.agent MUST exist.
//    *   - ctx.agent.wakeups.scheduleForCurrentThread({ run_at_s, reason }) MUST exist and:
//    *       - create a ScheduledWakeup row tied to the current thread id
//    *       - use your `WakeupStore` + `ScheduledWakeupRecord` schema
//    */
//   requiresApproval: async (ctx, params) => {
//     assert(ctx.agent, "ctx.agent required for wakeup tools");

//     const { delay_s, run_at_s, reason } = params as z.infer<
//       typeof WaitParamsSchema
//     >;

//     const now_s = Math.floor(Date.now() / 1000);
//     const targetRunAt =
//       run_at_s ?? (delay_s !== undefined ? now_s + delay_s : now_s);

//     // We avoid over-constraining the Agent type here by treating it as `any`,
//     // and only requiring a small, well-defined surface:
//     //
//     //   agent.wakeups.scheduleForCurrentThread({ run_at_s, reason? })
//     //
//     // You can implement this on Agent however you like, backed by WakeupStore.
//     const agent: any = ctx.agent;

//     if (!agent.wakeups || typeof agent.wakeups.scheduleForCurrentThread !== "function") {
//       throw new Error(
//         "Wakeup scheduler not configured on agent. " +
//           "Expected ctx.agent.wakeups.scheduleForCurrentThread(...) to be available.",
//       );
//     }

//     await agent.wakeups.scheduleForCurrentThread({
//       run_at_s: targetRunAt,
//       reason: reason ?? null,
//     });

//     // Returning true here causes the FunctionTool to return INTERRUPTIBLE
//     // (because there is no approval yet), which will stop/sleep the thread.
//     return true;
//   },

//   /**
//    * execute() is not expected to run before the wakeup.
//    *
//    * If you *later* implement a resume-path that "approves" this tool call
//    * (e.g. via your scheduler/poller marking the tool call approved), this
//    * execute() would run on resume. For now, it simply returns a small
//    * acknowledgment.
//    */
//   execute: async () => {
//     return {
//       scheduled: true,
//       message:
//         "Wakeup scheduled; thread will resume when the wakeup is processed.",
//     };
//   },
// });

// // --- Toolkit ---

// /**
//  * Wakeup system toolkit.
//  *
//  * Provides the wait_until tool for scheduling wakeups of the current thread.
//  */
// export const wakeup = new Toolkit({
//   id: "sys.wakeup",
//   description: "Tools for scheduling and managing agent wakeups.",
//   tools: [wait],
// });
