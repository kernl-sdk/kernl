import { createServer, type Server } from "node:http";
import { generatePKCE, generateState } from "./pkce";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTH_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const CALLBACK_PORT = 1455;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/auth/callback`;

interface PendingAuth {
  verifier: string;
  state: string;
  resolve: (code: string | null) => void;
  server: Server;
}

// Store pending auth flows
const pendingAuth = new Map<string, PendingAuth>();

/**
 * Start local OAuth callback server.
 */
function startCallbackServer(
  state: string,
  resolve: (code: string | null) => void,
): Server {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "", `http://localhost:${CALLBACK_PORT}`);

    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Error: Invalid state</h1>");
        resolve(null);
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <div style="text-align: center;">
              <h1>✓ Authorization successful</h1>
              <p>You can close this window and return to the terminal.</p>
            </div>
          </body>
        </html>
      `);

      resolve(code);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(CALLBACK_PORT);
  return server;
}

/**
 * Start OpenAI OAuth authorization flow.
 * Uses local callback server for automatic code capture.
 */
export function authorize(): {
  url: string;
  state: string;
  method: "auto";
  instructions: string;
  waitForCode: () => Promise<string | null>;
  cleanup: () => void;
} {
  const pkce = generatePKCE();
  const state = generateState();

  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "openid profile email offline_access");
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", "opencode");

  let resolveCode: (code: string | null) => void;
  const codePromise = new Promise<string | null>((resolve) => {
    resolveCode = resolve;
  });

  const server = startCallbackServer(state, resolveCode!);

  pendingAuth.set(state, {
    verifier: pkce.verifier,
    state,
    resolve: resolveCode!,
    server,
  });

  return {
    url: url.toString(),
    state,
    method: "auto",
    instructions: "Complete authorization in your browser...",
    waitForCode: () => codePromise,
    cleanup: () => {
      const pending = pendingAuth.get(state);
      if (pending) {
        pending.server.close();
        pendingAuth.delete(state);
      }
    },
  };
}

/**
 * Exchange authorization code for tokens.
 */
export async function callback(
  code: string,
  state: string,
): Promise<
  | { type: "success"; accessToken: string; refreshToken: string; expiresAt: number; accountId?: string }
  | { type: "failed"; error: string }
> {
  const pending = pendingAuth.get(state);
  if (!pending) {
    return { type: "failed", error: "Invalid state - authorization not found" };
  }

  // Clean up
  pending.server.close();
  pendingAuth.delete(state);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: pending.verifier,
    }),
  });

  if (!res.ok) {
    return { type: "failed", error: `Token exchange failed: ${res.status}` };
  }

  const data = (await res.json()) as {
    id_token?: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Extract account ID from JWT claims
  let accountId: string | undefined;
  if (data.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(data.id_token.split(".")[1], "base64").toString(),
      );
      accountId =
        payload.chatgpt_account_id ??
        payload["https://api.openai.com/auth"]?.chatgpt_account_id ??
        payload.organizations?.[0]?.id;
    } catch {
      // Ignore JWT parse errors
    }
  }

  return {
    type: "success",
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    accountId,
  };
}

/**
 * Refresh OpenAI OAuth tokens.
 */
export async function refresh(refreshToken: string): Promise<
  | { type: "success"; accessToken: string; refreshToken: string; expiresAt: number }
  | { type: "failed"; error: string }
> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
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
