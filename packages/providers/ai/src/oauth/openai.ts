import type { OpenAIOAuthCredentials } from "./types";

const TOKEN_URL = "https://auth.openai.com/oauth/token";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const CODEX_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Refresh OpenAI OAuth tokens.
 */
async function refresh(creds: OpenAIOAuthCredentials): Promise<void> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data = (await res.json()) as TokenResponse;

  creds.accessToken = data.access_token;
  creds.refreshToken = data.refresh_token;
  creds.expiresAt = Date.now() + data.expires_in * 1000;

  creds.onRefresh?.({
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
    expiresAt: creds.expiresAt,
  });
}

/**
 * Create a fetch wrapper for OpenAI Codex OAuth.
 *
 * Redirects all requests to the Codex endpoint and adds OAuth headers.
 */
export function createOAuthFetch(creds: OpenAIOAuthCredentials) {
  return async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    // Refresh if expired (with 30s buffer)
    if (Date.now() >= creds.expiresAt - 30_000) {
      await refresh(creds);
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${creds.accessToken}`);

    if (creds.accountId) {
      headers.set("ChatGPT-Account-Id", creds.accountId);
    }

    // Transform request body for Codex API
    // Codex requires "instructions" field instead of developer/system role in input
    let body = init?.body;
    if (body && typeof body === "string") {
      try {
        const parsed = JSON.parse(body);

        // Extract developer/system message as instructions
        if (parsed.input && Array.isArray(parsed.input)) {
          const devIdx = parsed.input.findIndex(
            (m: Record<string, unknown>) =>
              m.role === "developer" || m.role === "system",
          );
          if (devIdx !== -1) {
            const devMsg = parsed.input[devIdx];
            parsed.instructions = devMsg.content;
            parsed.input.splice(devIdx, 1);
          }
        }

        body = JSON.stringify(parsed);
      } catch {
        // ignore parse errors
      }
    }

    return fetch(CODEX_ENDPOINT, { ...init, headers, body });
  };
}
