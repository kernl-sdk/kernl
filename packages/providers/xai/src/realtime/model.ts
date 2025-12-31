import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeConnectOptions,
  ClientCredential,
} from "@kernl-sdk/protocol";

import { GrokRealtimeConnection } from "./connection";

const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
const XAI_CLIENT_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets";

/**
 * Options for creating a Grok realtime model.
 */
export interface GrokRealtimeOptions {
  /**
   * xAI API key. Defaults to XAI_API_KEY env var.
   */
  apiKey?: string;

  /**
   * Base URL for the realtime API.
   */
  baseUrl?: string;
}

/**
 * Grok (xAI) realtime model implementation.
 */
export class GrokRealtimeModel implements RealtimeModel {
  readonly spec = "1.0" as const;
  readonly provider = "xai";
  readonly modelId = "grok-realtime";

  private apiKey: string | null;
  private baseUrl: string;

  constructor(options?: GrokRealtimeOptions) {
    this.apiKey =
      options?.apiKey ??
      (typeof process !== "undefined" ? process.env?.XAI_API_KEY : null) ??
      null;
    this.baseUrl = options?.baseUrl ?? XAI_REALTIME_URL;
  }

  /**
   * Create ephemeral credential for client-side connections.
   *
   * Must be called server-side where API key is available.
   */
  async authenticate(): Promise<ClientCredential> {
    if (!this.apiKey) {
      throw new Error(
        "API key required for authenticate(). " +
          "Call this server-side where XAI_API_KEY is available.",
      );
    }

    const res = await fetch(XAI_CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: 300 },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create credential: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { value: string };
    return {
      kind: "token",
      token: data.value,
      expiresAt: new Date(Date.now() + 300_000), // 5 min TTL
    };
  }

  /**
   * Establish a WebSocket connection to the Grok realtime API.
   */
  async connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection> {
    const credential = options?.credential;

    if (credential && credential.kind !== "token") {
      throw new Error(
        `Grok requires token credentials, got "${credential.kind}".`,
      );
    }

    const authToken = credential?.token ?? this.apiKey;

    if (!authToken) {
      throw new Error(
        "No API key or credential provided. " +
          "Either set XAI_API_KEY or pass a credential from authenticate().",
      );
    }

    // Use injectable WebSocket or globalThis.WebSocket
    const WS = options?.websocket ?? globalThis.WebSocket;
    if (!WS) {
      throw new Error(
        "No WebSocket available. In Node.js <22, use WebSocketTransport with the 'ws' package:\n" +
          "  import WebSocket from 'ws';\n" +
          "  import { WebSocketTransport } from 'kernl';\n" +
          "  new RealtimeSession(agent, { transport: new WebSocketTransport({ websocket: WebSocket }), ... })",
      );
    }

    // xAI uses OpenAI-compatible subprotocols for browser WebSocket auth
    const protocols = [
      "realtime",
      `openai-insecure-api-key.${authToken}`,
      "openai-beta.realtime-v1",
    ];
    const ws = new WS(this.baseUrl, protocols);

    const connection = new GrokRealtimeConnection(ws);

    await new Promise<void>((resolve, reject) => {
      if (options?.abort?.aborted) {
        return reject(new Error("Connection aborted"));
      }

      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (event: unknown) => {
        cleanup();
        const err =
          event instanceof Error
            ? event
            : new Error("WebSocket connection failed");
        reject(err);
      };
      const onAbort = () => {
        cleanup();
        ws.close();
        reject(new Error("Connection aborted"));
      };

      const cleanup = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
        options?.abort?.removeEventListener("abort", onAbort);
      };

      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      options?.abort?.addEventListener("abort", onAbort);
    });

    return connection;
  }
}
