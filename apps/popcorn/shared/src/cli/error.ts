/**
 * Error formatting utilities for CLI output
 */

export function FormatError(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message
  }
  return undefined
}

export function FormatUnknownError(error: unknown): string {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  return String(error)
}
