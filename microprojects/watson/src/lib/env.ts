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
  WEB_DOMAIN: z.string().optional().default("http://localhost:3000"),

  // --- database ---
  DATABASE_URL: z.string(),

  // --- vector search ---
  TURBOPUFFER_API_KEY: z.string(),

  // --- providers ---
  ANTHROPIC_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),

  // --- integrations (optional until we integrate) ---
  FIREFLIES_API_KEY: z.string().optional(),
  FIREFLIES_WEBHOOK_SECRET: z.string().optional(),

  // --- workflow ---
  WORKFLOW_TARGET_WORLD: z.string().default("@workflow/world-postgres"),
  WORKFLOW_POSTGRES_URL: z.string(),
  WORKFLOW_POSTGRES_JOB_PREFIX: z.string().default("watson_"),
  WORKFLOW_POSTGRES_WORKER_CONCURRENCY: z.coerce.number().default(10),
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
