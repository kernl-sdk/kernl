import { generatePKCE } from "./pkce";

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";

export interface AnthropicAuthState {
  verifier: string;
}

// Store pending auth states (verifier keyed by state)
const pendingAuth = new Map<string, AnthropicAuthState>();

/**
 * Start Anthropic OAuth authorization flow.
 * Returns URL for user to visit and instructions.
 */
export function authorize(): {
  url: string;
  state: string;
  method: "code";
  instructions: string;
} {
  const pkce = generatePKCE();

  const url = new URL("https://claude.ai/oauth/authorize");
  url.searchParams.set("code", "true");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "org:create_api_key user:profile user:inference");
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", pkce.verifier);

  // Store verifier for callback
  pendingAuth.set(pkce.verifier, { verifier: pkce.verifier });

  return {
    url: url.toString(),
    state: pkce.verifier,
    method: "code",
    instructions: "Paste the authorization code here:",
  };
}

/**
 * Exchange authorization code for tokens.
 * The code format is: {code}#{state}
 */
export async function callback(
  code: string,
  state: string,
): Promise<
  | { type: "success"; accessToken: string; refreshToken: string; expiresAt: number }
  | { type: "failed"; error: string }
> {
  const authState = pendingAuth.get(state);
  if (!authState) {
    return { type: "failed", error: "Invalid state - authorization not found" };
  }

  pendingAuth.delete(state);

  // Parse code#state format
  const [codeValue, stateValue] = code.split("#");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: codeValue,
      state: stateValue,
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: authState.verifier,
    }),
  });

  if (!res.ok) {
    return { type: "failed", error: `Token exchange failed: ${res.status}` };
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    type: "success",
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh Anthropic OAuth tokens.
 */
export async function refresh(refreshToken: string): Promise<
  | { type: "success"; accessToken: string; refreshToken: string; expiresAt: number }
  | { type: "failed"; error: string }
> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!res.ok) {
    return { type: "failed", error: `Token refresh failed: ${res.status}` };
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    type: "success",
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
