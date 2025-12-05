/**
 * Lightweight HTTP client for API requests.
 */
export class HttpClient {
  constructor(private baseUrl: string) {}

  async get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const search = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) search.set(k, String(v));
      }
    }
    const query = search.toString();
    const url = `${this.baseUrl}${path}${query ? `?${query}` : ""}`;
    return this.request(url);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request(`${this.baseUrl}${path}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request(`${this.baseUrl}${path}`, { method: "DELETE" });
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message ?? res.statusText);
    }

    return res.json();
  }
}

/**
 * Error thrown when an API request fails.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
