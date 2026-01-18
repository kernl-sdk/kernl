import type { UIMessage } from "ai";

// --------------------
// Thread Types
// --------------------

export interface ThreadResource {
  tid: string;
  agentId: string;
  title?: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  model: {
    provider: string;
    modelId: string;
  };
  context: Record<string, unknown>;
  parentTaskId: string | null;
}

export interface ThreadMessagesResponse {
  messages: UIMessage[];
}

export interface ThreadCreateParams {
  tid?: string;
  agentId: string;
  title?: string;
  context?: Record<string, unknown>;
}

export interface ListThreadsParams {
  limit?: number;
  offset?: number;
  agentId?: string;
}

export interface ListThreadsResponse {
  threads: ThreadResource[];
  count: number;
}

// --------------------
// Agent Types
// --------------------

export interface AgentResource {
  id: string;
  name: string;
  description?: string;
  model: {
    provider: string;
    modelId: string;
  };
  // Add other agent fields as needed
}

// --------------------
// Error Types
// --------------------

export class KernlApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message || `Kernl API Error: ${status} ${statusText}`);
    this.name = "KernlApiError";
  }
}
