import { vi } from "vitest";
import { Emitter } from "@kernl-sdk/shared";
import type { RealtimeChannel, RealtimeChannelEvents } from "@kernl-sdk/protocol";

/**
 * Mock RealtimeChannel for testing.
 */
export class MockRealtimeChannel
  extends Emitter<RealtimeChannelEvents>
  implements RealtimeChannel
{
  sendAudio: ReturnType<typeof vi.fn>;
  interrupt: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;

  /** Captured audio sent via sendAudio() */
  sentAudio: string[] = [];

  constructor() {
    super();

    this.sendAudio = vi.fn((audio: string) => {
      this.sentAudio.push(audio);
    });
    this.interrupt = vi.fn();
    this.close = vi.fn();
  }

  /**
   * Simulate audio input from the channel.
   */
  simulateAudioInput(audio: string): void {
    this.emit("audio", audio);
  }

  /**
   * Simulate commit event (end of speech).
   */
  simulateCommit(): void {
    this.emit("commit");
  }

  /**
   * Simulate interrupt event.
   */
  simulateInterrupt(): void {
    this.emit("interrupt");
  }

  /**
   * Clear captured audio.
   */
  clearSentAudio(): void {
    this.sentAudio = [];
  }
}

/**
 * Create a mock channel.
 */
export function createMockChannel(): MockRealtimeChannel {
  return new MockRealtimeChannel();
}
