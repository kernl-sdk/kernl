import { appendFileSync } from "node:fs";
import type { OAuthCredentials } from "./types";

const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

function debug(msg: string) {
  try {
    appendFileSync("/tmp/popcorn-debug.log", `${new Date().toISOString()} [oauth/anthropic] ${msg}\n`);
  } catch {
    // ignore
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Refresh Anthropic OAuth tokens.
 */
async function refresh(creds: OAuthCredentials): Promise<void> {
  debug(`Refreshing token...`);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
  debug(`Token refreshed successfully`);
}

/**
 * Create a fetch wrapper for Anthropic OAuth.
 *
 * Uses the standard Anthropic API with OAuth bearer token.
 */
export function createOAuthFetch(creds: OAuthCredentials) {
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
    // Required beta header for OAuth
    headers.set("anthropic-beta", "oauth-2025-04-20");

    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    debug(`Request to: ${url}`);

    const response = await fetch(input, { ...init, headers });

    debug(`Response status: ${response.status}`);
    if (!response.ok) {
      const text = await response.clone().text();
      debug(`Error response: ${text.slice(0, 1000)}`);
    }

    return response;
  };
}
