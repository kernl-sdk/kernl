/**
 * Protocol Constants
 *
 * Centralized constants for the kernl protocol.
 */

// ----------------------------
// Tool states
// ----------------------------

export const IN_PROGRESS = "in_progress";
export const COMPLETED = "completed";
export const FAILED = "failed";

// ----------------------------
// Thread/Task states
// ----------------------------

/**
 * Task is either:
 * - Currently executing
 * - In run queue waiting to be scheduled (might want to differentiate between running + queued here)
 */
export const RUNNING = "running";

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
export const INTERRUPTIBLE = "interruptible";

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
export const UNINTERRUPTIBLE = "uninterruptible";

/**
 * Task has been stopped by a signal (SIGSTOP).
 * Will remain stopped until explicitly continued (SIGCONT).
 *
 * Examples:
 * - User explicitly paused the agent
 * - Debugger attached
 */
export const STOPPED = "stopped";

/**
 * Task has finished execution but hasn't been cleaned up yet.
 * Waiting for parent to read exit status (wait/waitpid).
 *
 * Examples:
 * - Agent completed but result not yet retrieved
 * - Child agent finished, parent needs to collect result
 */
export const ZOMBIE = "zombie";

/**
 * Task is being removed from the system.
 * Final cleanup in progress, about to be fully deleted.
 */
export const DEAD = "dead";

// ----------------------------
// WebSocket ready states
// ----------------------------

export const WS_CONNECTING = 0;
export const WS_OPEN = 1;
export const WS_CLOSING = 2;
export const WS_CLOSED = 3;
