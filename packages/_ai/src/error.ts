/**
 * Wrap AI SDK errors with additional context.
 *
 * @param error - The error from AI SDK
 * @param context - Additional context about where the error occurred
 */
export function wrapError(error: unknown, context: string): Error {
  if (error instanceof Error) {
    const wrapped = new Error(`AI SDK error in ${context}: ${error.message}`);
    wrapped.stack = error.stack;
    wrapped.cause = error;
    return wrapped;
  }

  return new Error(`AI SDK error in ${context}: ${String(error)}`);
}
