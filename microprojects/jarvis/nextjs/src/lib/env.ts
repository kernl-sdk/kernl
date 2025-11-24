import "server-only";

import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This ensures all environment variables are valid at startup.
 */
const schema = z.object({
  // --- api ---
  API_BASE_URL: z.string().optional().default("http://localhost:8080"),
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
