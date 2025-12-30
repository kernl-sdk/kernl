import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This ensures all environment variables are valid at startup.
 * All variables are optional with sensible defaults.
 */
const envSchema = z.object({
  // --- Logging ---
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  KERNL_LOG_MODEL_DATA: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  KERNL_LOG_TOOL_DATA: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

/**
 * Validated and type-safe environment variables
 *
 * @example
 * import { env } from '@/env';
 * console.log(env.LOG_LEVEL);
 */
export const env = envSchema.parse(
  typeof process !== "undefined" ? process.env : {},
);

/**
 * Type of the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;
