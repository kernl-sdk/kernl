import "server-only";

import { KernlClient } from "./client";
import { env } from "@/lib/env";

/**
 * Server-side Kernl client instance
 *
 * Uses NEXT_PUBLIC_API_BASE_URL for both server and client.
 * For client-side usage, import from "@/lib/kernl" instead.
 */
export const kernl = new KernlClient(env.NEXT_PUBLIC_API_BASE_URL);
