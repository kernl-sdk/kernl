import { HttpClient } from "@/lib/http";
import type {
  Thread,
  ThreadsListParams,
  ThreadsListResponse,
  Agent,
  AgentsListResponse,
  Toolkit,
  ToolkitsListResponse,
} from "./types";

const BASE_URL = "/api";

/**
 * Stainless-style API client for the Kernl server.
 *
 * @example
 * ```ts
 * const threads = await api.threads.list({ agentId: 'echo' });
 * const thread = await api.threads.get('tid_123');
 * ```
 */
export class KernlClient {
  readonly threads: ThreadsResource;
  readonly agents: AgentsResource;
  readonly toolkits: ToolkitsResource;

  constructor(baseUrl: string = BASE_URL) {
    const http = new HttpClient(baseUrl);
    this.threads = new ThreadsResource(http);
    this.agents = new AgentsResource(http);
    this.toolkits = new ToolkitsResource(http);
  }
}

class ThreadsResource {
  constructor(private http: HttpClient) {}

  list(params?: ThreadsListParams) {
    return this.http.get<ThreadsListResponse>("/threads", {
      agent_id: params?.agentId,
      limit: params?.limit,
    });
  }

  get(tid: string) {
    return this.http.get<Thread>(`/threads/${tid}`);
  }

  delete(tid: string) {
    return this.http.delete<{ success: boolean }>(`/threads/${tid}`);
  }
}

class AgentsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<AgentsListResponse>("/agents");
  }

  get(id: string) {
    return this.http.get<Agent>(`/agents/${id}`);
  }
}

class ToolkitsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<ToolkitsListResponse>("/toolkits");
  }

  get(id: string) {
    return this.http.get<Toolkit>(`/toolkits/${id}`);
  }
}

export const kernl = new KernlClient();
