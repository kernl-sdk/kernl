import type { UIMessage } from "ai";

// ---- threads ----

/**
 * Parameters for listing threads.
 */
export interface ThreadsListParams {
  agentId?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Response from listing threads.
 */
export interface ThreadsListResponse {
  threads: Thread[];
  next: string | null;
}

/**
 * A conversation thread with an agent.
 */
export interface Thread {
  tid: string;
  namespace: string;
  title?: string | null;
  agentId: string;
  model: { provider: string; modelId: string };
  state: string;
  createdAt: string;
  updatedAt: string;
  history?: UIMessage[];
}

// ---- agents ----

/**
 * Response from listing agents.
 */
export interface AgentsListResponse {
  agents: Agent[];
}

/**
 * An agent configuration.
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  model: { provider: string; modelId: string };
  memory: { enabled: boolean };
  toolkits: string[];
}

// ---- toolkits ----

/**
 * Response from listing toolkits.
 */
export interface ToolkitsListResponse {
  toolkits: Toolkit[];
}

/**
 * A collection of tools available to agents.
 */
export interface Toolkit {
  id: string;
  name: string;
  description?: string;
  type: "mcp" | "function";
  url?: string;
  tools?: Tool[];
}

/**
 * A callable tool within a toolkit.
 */
export interface Tool {
  id: string;
  name: string;
  description?: string;
}
