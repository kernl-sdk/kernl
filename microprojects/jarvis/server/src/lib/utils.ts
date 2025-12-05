import { Agent } from "kernl";

import { logger } from "./logger";

/**
 * Generate thread title asynchronously via titler agent.
 *
 * Safe to run concurrently with streaming because Thread.checkpoint()
 * does not update metadata - only the initial insert does.
 *
 * Errors are caught and logged - this function never rejects.
 */
export async function generateTitle(
  message: unknown,
  titler: Agent,
  onComplete: (title: string) => Promise<void>,
): Promise<void> {
  try {
    const prompt = `User message: ${JSON.stringify(message)}`;
    const res = await titler.run(prompt);
    await onComplete(res.response);
  } catch (err) {
    logger.warn({ err }, "Async title generation failed");
  }
}
