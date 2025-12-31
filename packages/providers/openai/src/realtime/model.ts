import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeConnectOptions,
  ClientCredential,
} from "@kernl-sdk/protocol";

import { OpenAIRealtimeConnection } from "./connection";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime";
const OPENAI_CLIENT_SECRETS_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

/**
 * Options for creating an OpenAI realtime model.
 */
export interface OpenAIRealtimeOptions {
  /**
   * OpenAI API key. Defaults to OPENAI_API_KEY env var.
   */
  apiKey?: string;

  /**
   * Base URL for the realtime API.
   */
  baseUrl?: string;
}

/**
 * OpenAI realtime model implementation.
 */
export class OpenAIRealtimeModel implements RealtimeModel {
  readonly spec = "1.0" as const;
  readonly provider = "openai";
  readonly modelId: string;

  private apiKey: string | null;
  private baseUrl: string;

  constructor(modelId: string, options?: OpenAIRealtimeOptions) {
    this.modelId = modelId;
    this.apiKey =
      options?.apiKey ??
      (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : null) ??
      null;
    this.baseUrl = options?.baseUrl ?? OPENAI_REALTIME_URL;
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
          "Call this server-side where OPENAI_API_KEY is available.",
      );
    }

    const res = await fetch(OPENAI_CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: { type: "realtime", model: this.modelId },
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
      expiresAt: new Date(Date.now() + 60_000), // ~60s TTL
    };
  }

  /**
   * Establish a WebSocket connection to the OpenAI realtime API.
   */
  async connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection> {
    const credential = options?.credential;

    if (credential && credential.kind !== "token") {
      throw new Error(
        `OpenAI requires token credentials, got "${credential.kind}".`,
      );
    }

    const authToken = credential?.token ?? this.apiKey;

    if (!authToken) {
      throw new Error(
        "No API key or credential provided. " +
          "Either set OPENAI_API_KEY or pass a credential from authenticate().",
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

    const url = `${this.baseUrl}?model=${this.modelId}`;

    // Use subprotocol auth (works in browsers and Node)
    // Note: Don't include openai-beta.realtime-v1 when using ephemeral tokens -
    // the version is encoded in the token itself
    const protocols = ["realtime", `openai-insecure-api-key.${authToken}`];
    const ws = new WS(url, protocols);

    const connection = new OpenAIRealtimeConnection(ws);

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
