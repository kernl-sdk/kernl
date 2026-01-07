import { vi } from "vitest";
import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeConnectOptions,
  RealtimeAuthenticateOptions,
  ClientCredential,
} from "@kernl-sdk/protocol";

import { MockRealtimeConnection, createMockConnection } from "./mock-connection";

/**
 * Options for creating a mock realtime model.
 */
export interface MockRealtimeModelOptions {
  provider?: string;
  modelId?: string;
  /** Connection to return from connect() */
  connection?: MockRealtimeConnection;
  /** Make connect() throw this error */
  connectError?: Error;
  /** Credential to return from authenticate() */
  credential?: ClientCredential;
  /** Make authenticate() throw this error */
  authenticateError?: Error;
}

/**
 * Mock RealtimeModel for testing.
 */
export class MockRealtimeModel implements RealtimeModel {
  readonly spec = "1.0" as const;
  readonly provider: string;
  readonly modelId: string;

  connect: ReturnType<typeof vi.fn>;
  authenticate: ReturnType<typeof vi.fn>;

  private _connection: MockRealtimeConnection;
  private _connectError?: Error;
  private _credential: ClientCredential;
  private _authenticateError?: Error;

  constructor(options: MockRealtimeModelOptions = {}) {
    this.provider = options.provider ?? "mock";
    this.modelId = options.modelId ?? "mock-realtime-model";
    this._connection = options.connection ?? createMockConnection();
    this._connectError = options.connectError;
    this._credential = options.credential ?? {
      kind: "token",
      token: "mock-token",
      expiresAt: new Date(Date.now() + 3600000),
    };
    this._authenticateError = options.authenticateError;

    this.connect = vi.fn(async (_options?: RealtimeConnectOptions) => {
      if (this._connectError) {
        throw this._connectError;
      }
      return this._connection;
    });

    this.authenticate = vi.fn(
      async (_options?: RealtimeAuthenticateOptions) => {
        if (this._authenticateError) {
          throw this._authenticateError;
        }
        return this._credential;
      },
    );
  }

  /**
   * Get the mock connection that will be returned from connect().
   */
  getConnection(): MockRealtimeConnection {
    return this._connection;
  }

  /**
   * Set a new connection to return from connect().
   */
  setConnection(connection: MockRealtimeConnection): void {
    this._connection = connection;
  }

  /**
   * Make connect() throw an error.
   */
  setConnectError(error: Error | undefined): void {
    this._connectError = error;
  }

  /**
   * Make authenticate() throw an error.
   */
  setAuthenticateError(error: Error | undefined): void {
    this._authenticateError = error;
  }
}

/**
 * Create a mock realtime model.
 */
export function createMockRealtimeModel(
  options?: MockRealtimeModelOptions,
): MockRealtimeModel {
  return new MockRealtimeModel(options);
}
