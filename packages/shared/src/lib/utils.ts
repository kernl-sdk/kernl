/**
 * Async version of Array.filter() that works with async predicates.
 * Runs all predicates in parallel and filters based on results.
 */
export async function filter<T>(
  array: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
}

export type SafeExecuteResult<T> = [Error | unknown | null, T | null];

export async function safeExecute<T>(
  fn: () => T,
): Promise<SafeExecuteResult<T>> {
  try {
    return [null, await fn()];
  } catch (error) {
    return [error, null];
  }
}

/**
 * Generate an ISO 8601 timestamp of the current time.
 * @returns An ISO 8601 timestamp.
 */
export function timeISO(): string {
  return new Date().toISOString();
}

/**
 * Generate a random ID with the specified number of bytes.
 * @param bytes - Number of bytes to generate (e.g., 8 for 64-bit, 16 for 128-bit)
 * @returns A hex string representation of the random bytes
 */
export function randomID(bytes: number = 12): string {
  const byteArray = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(byteArray);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < bytes; i++) {
      byteArray[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(byteArray, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
