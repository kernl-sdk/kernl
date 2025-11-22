import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This ensures all environment variables are valid at startup.
 */
const schema = z.object({
  // --- config ---
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional()
    .default("info"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  PORT: z.string().optional().default("8080"),
  HOST: z.string().optional().default("0.0.0.0"),

  // --- database ---
  DATABASE_URL: z.string(),

  // --- providers ---
  ANTHROPIC_API_KEY: z.string(),
  // OPENAI_API_KEY: z.string(),

  // --- toolkits ---
  LINEAR_API_KEY: z.string(),
  GITHUB_TOKEN: z.string(),
});

/**
 * Validated and type-safe environment variables
 *
 * @example
 * import { env } from '@/env';
 * console.log(env.LOG_LEVEL);
 */
export const env = schema.parse(process.env);

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof schema>;
