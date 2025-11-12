import type { Agent } from "@/agent";
import type { Context, UnknownContext } from "@/context";

import type { Thread } from "@/thread";

/**
 * A Task represents a unit of work scheduled by the kernl.
 * Analogous to task_struct in the Linux kernel.
 */
export class Task<TContext = UnknownContext, TResult = unknown> {
  pid: string /* process ID - unique identifier for this task */;
  // tgid: string | null; /* task groupid */
  // prio: TaskPriority;
  instructions:
    | string
    | ((context: Context<TContext>) => string) /* dynamic instructions */;
  // sched: TaskSched; /* scheduling (timers, timeouts, deadlines) */
  state: TaskState /* current state of the task */;
  owner: Agent<TContext> /* agent that currently owns this task */;

  context: Context<TContext> /* execution context propagated throughout call graph */;
  // cred: Credentials; /* Effective (overridable) subjective task credentials (COW): */
  // realcred: Credentials; /* Objective and real subjective task credentials (COW): */

  /**
   * Might want the ability to pick up a new thread of execution from a compressed task checkpoint instead of including
   * all of the events from the old threads (which may no longer be useful if they completed with good artifacts + reasoning / action summaries).
   * At that point its really more about tracing.
   */
  threads: Thread<TContext>[] /* all threads associated with this task */;
  current: Thread<TContext> | null /* current executing thread (if any) */;
  result: TResult | null /* final result of the task */;
  // checkpoints: TaskCheckpoint<TContext>[]; /* checkpoints for resuming execution */

  // TODO: Deferred fields for later implementation
  // tgid: string;              // Thread group ID
  // limits: TaskLimits;        // Resource limits (max ticks, tokens, timeout)
  // nsproxy: NamespaceProxy;   // Namespace isolation

  constructor(init: {
    pid: string;
    instructions: string | ((context: Context<TContext>) => string);
    state: TaskState;
    owner: Agent<TContext>;
    context: Context<TContext>;
  }) {
    this.pid = init.pid;
    this.instructions = init.instructions;
    this.state = init.state;
    this.owner = init.owner;
    this.context = init.context;
    this.threads = [];
    this.current = null;
    this.result = null;
  }
}

/**
 * The various states that a task may be in.
 */
export enum TaskState {
  /**
   * Task is either:
   * - Currently executing
   * - In run queue waiting to be scheduled (might want to differentiate between running + queued here)
   */
  RUNNING = "running",

  /**
   * Task is sleeping/blocked, waiting for a condition.
   * Can be woken up by:
   * - The condition being met (e.g., approval granted)
   * - A signal (e.g., user cancellation)
   *
   * Examples:
   * - Waiting for tool approval
   * - Waiting for user input
   * - Sleeping on a timer
   */
  INTERRUPTIBLE = "interruptible",

  /**
   * Task is sleeping/blocked and CANNOT be interrupted by signals.
   * Only wakes when the condition is met.
   *
   * Examples:
   * - Waiting for critical I/O (model API call)
   * - Waiting for resource that MUST complete
   *
   * Use sparingly - these tasks can't be cancelled!
   */
  UNINTERRUPTIBLE = "uninterruptible",

  /**
   * Task has been stopped by a signal (SIGSTOP).
   * Will remain stopped until explicitly continued (SIGCONT).
   *
   * Examples:
   * - User explicitly paused the agent
   * - Debugger attached
   */
  STOPPED = "stopped",

  /**
   * Task has finished execution but hasn't been cleaned up yet.
   * Waiting for parent to read exit status (wait/waitpid).
   *
   * Examples:
   * - Agent completed but result not yet retrieved
   * - Child agent finished, parent needs to collect result
   */
  ZOMBIE = "zombie",

  /**
   * Task is being removed from the system.
   * Final cleanup in progress, about to be fully deleted.
   */
  DEAD = "dead",
}
