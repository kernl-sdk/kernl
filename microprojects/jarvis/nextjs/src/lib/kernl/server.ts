import "server-only";

import { KernlClient } from "./client";
import { env } from "@/lib/env";

/**
 * Server-side Kernl client instance
 *
 * Uses the server-only API_BASE_URL environment variable.
 * For client-side usage, import from "@/lib/kernl" instead.
 */
export const kernl = new KernlClient(env.API_BASE_URL);
