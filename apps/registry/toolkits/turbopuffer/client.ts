import { turbopuffer } from "@kernl-sdk/turbopuffer";

export const tpuf = turbopuffer({
  apiKey: process.env.TURBOPUFFER_API_KEY!,
  region: process.env.TURBOPUFFER_REGION!,
});

/**
 * Context for Turbopuffer tools.
 *
 * The namespace is typically set programmatically based on agent context.
 * If you want the agent to choose the namespace, add it to the tool parameters.
 */
export interface TurbopufferContext {
  namespace: string;
}
