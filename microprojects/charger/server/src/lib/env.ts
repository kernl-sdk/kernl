import { z } from "zod";

const schema = z.object({
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional()
    .default("info"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  PORT: z.string().optional().default("3001"),
  HOST: z.string().optional().default("0.0.0.0"),
  WEB_ORIGIN: z.string().optional().default("http://localhost:3000"),

  DATABASE_URL: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  DAYTONA_API_KEY: z.string(),
  PARALLEL_API_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
