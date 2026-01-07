import { vi } from "vitest";
import { Emitter } from "@kernl-sdk/shared";
import type {
  RealtimeConnection,
  RealtimeConnectionEvents,
  RealtimeClientEvent,
  TransportStatus,
} from "@kernl-sdk/protocol";

/**
 * Options for creating a mock connection.
 */
export interface MockConnectionOptions {
  status?: TransportStatus;
  sessionId?: string | null;
  muted?: boolean | null;
}

/**
 * Mock RealtimeConnection for testing.
 */
export class MockRealtimeConnection
  extends Emitter<RealtimeConnectionEvents>
  implements RealtimeConnection
{
  status: TransportStatus;
  muted: boolean | null;
  sessionId: string | null;

  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  mute: ReturnType<typeof vi.fn>;
  unmute: ReturnType<typeof vi.fn>;
  interrupt: ReturnType<typeof vi.fn>;

  /** Captured events sent via send() */
  sentEvents: RealtimeClientEvent[] = [];

  constructor(options: MockConnectionOptions = {}) {
    super();
    this.status = options.status ?? "connected";
    this.sessionId = options.sessionId ?? "test-session-id";
    this.muted = options.muted ?? false;

    this.send = vi.fn((event: RealtimeClientEvent) => {
      this.sentEvents.push(event);
    });
    this.close = vi.fn();
    this.mute = vi.fn(() => {
      this.muted = true;
    });
    this.unmute = vi.fn(() => {
      this.muted = false;
    });
    this.interrupt = vi.fn();
  }

  /**
   * Simulate receiving a server event.
   */
  simulateEvent(event: RealtimeConnectionEvents["event"][0]): void {
    this.emit("event", event);
  }

  /**
   * Simulate an error.
   */
  simulateError(error: Error): void {
    this.emit("error", error);
  }

  /**
   * Simulate status change.
   */
  simulateStatus(status: TransportStatus): void {
    this.status = status;
    this.emit("status", status);
  }

  /**
   * Simulate interruption.
   */
  simulateInterrupted(): void {
    this.emit("interrupted");
  }

  /**
   * Get the last sent event of a specific kind.
   */
  getLastSentEvent<K extends RealtimeClientEvent["kind"]>(
    kind: K,
  ): Extract<RealtimeClientEvent, { kind: K }> | undefined {
    return this.sentEvents
      .filter((e): e is Extract<RealtimeClientEvent, { kind: K }> => e.kind === kind)
      .pop();
  }

  /**
   * Clear captured events.
   */
  clearSentEvents(): void {
    this.sentEvents = [];
  }
}

/**
 * Create a mock connection.
 */
export function createMockConnection(
  options?: MockConnectionOptions,
): MockRealtimeConnection {
  return new MockRealtimeConnection(options);
}
