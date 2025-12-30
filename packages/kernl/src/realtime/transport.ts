import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeTransport,
  RealtimeConnectOptions,
  WebSocketConstructor,
} from "@kernl-sdk/protocol";

/**
 * Options for creating a WebSocket transport.
 */
export interface WebSocketTransportOptions {
  /**
   * WebSocket constructor to use.
   *
   * Required in Node.js <22 (provide the 'ws' package).
   * Optional in browsers and Node.js 22+ (uses globalThis.WebSocket).
   *
   * @example
   * ```ts
   * import WebSocket from 'ws';
   * new WebSocketTransport({ websocket: WebSocket });
   * ```
   */
  websocket?: WebSocketConstructor;
}

/**
 * WebSocket transport for realtime connections.
 *
 * Use this transport when you need to provide a custom WebSocket implementation,
 * such as the 'ws' package in Node.js <22.
 *
 * @example
 * ```ts
 * // Node.js <22
 * import WebSocket from 'ws';
 * const session = new RealtimeSession(agent, {
 *   transport: new WebSocketTransport({ websocket: WebSocket }),
 *   ...
 * });
 *
 * // Browser or Node.js 22+ - no transport needed
 * const session = new RealtimeSession(agent, { ... });
 * ```
 */
export class WebSocketTransport implements RealtimeTransport {
  readonly handlesAudio = false;
  private WS: WebSocketConstructor | undefined;

  constructor(options?: WebSocketTransportOptions) {
    this.WS = options?.websocket;
  }

  async connect(
    model: RealtimeModel,
    options?: RealtimeConnectOptions,
  ): Promise<RealtimeConnection> {
    return model.connect({
      ...options,
      websocket: this.WS ?? options?.websocket,
    });
  }
}
