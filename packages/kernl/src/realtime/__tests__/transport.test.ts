import { describe, it, expect, vi } from "vitest";
import type { WebSocketConstructor } from "@kernl-sdk/protocol";

import { WebSocketTransport } from "../transport";
import { createMockRealtimeModel, createMockConnection } from "./fixtures";

describe("WebSocketTransport", () => {
  describe("constructor", () => {
    it("should set handlesAudio to false", () => {
      const transport = new WebSocketTransport();
      expect(transport.handlesAudio).toBe(false);
    });

    it("should store websocket constructor from options", () => {
      const MockWebSocket = vi.fn() as unknown as WebSocketConstructor;
      const transport = new WebSocketTransport({ websocket: MockWebSocket });

      // Access private property for testing
      expect((transport as any).WS).toBe(MockWebSocket);
    });

    it("should work without options", () => {
      const transport = new WebSocketTransport();
      expect((transport as any).WS).toBeUndefined();
    });
  });

  describe("connect()", () => {
    it("should call model.connect() with options", async () => {
      const connection = createMockConnection();
      const model = createMockRealtimeModel({ connection });
      const transport = new WebSocketTransport();

      const connectOptions = {
        sessionConfig: { instructions: "Test" },
      };

      await transport.connect(model, connectOptions);

      expect(model.connect).toHaveBeenCalledTimes(1);
      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: { instructions: "Test" },
        }),
      );
    });

    it("should pass custom websocket to model.connect()", async () => {
      const connection = createMockConnection();
      const model = createMockRealtimeModel({ connection });
      const MockWebSocket = vi.fn() as unknown as WebSocketConstructor;
      const transport = new WebSocketTransport({ websocket: MockWebSocket });

      await transport.connect(model);

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          websocket: MockWebSocket,
        }),
      );
    });

    it("should prefer transport websocket over options websocket", async () => {
      const connection = createMockConnection();
      const model = createMockRealtimeModel({ connection });
      const TransportWebSocket = vi.fn() as unknown as WebSocketConstructor;
      const OptionsWebSocket = vi.fn() as unknown as WebSocketConstructor;

      const transport = new WebSocketTransport({ websocket: TransportWebSocket });

      await transport.connect(model, { websocket: OptionsWebSocket });

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          websocket: TransportWebSocket,
        }),
      );
    });

    it("should use options websocket when transport has none", async () => {
      const connection = createMockConnection();
      const model = createMockRealtimeModel({ connection });
      const OptionsWebSocket = vi.fn() as unknown as WebSocketConstructor;

      const transport = new WebSocketTransport();

      await transport.connect(model, { websocket: OptionsWebSocket });

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          websocket: OptionsWebSocket,
        }),
      );
    });

    it("should return connection from model", async () => {
      const connection = createMockConnection();
      const model = createMockRealtimeModel({ connection });
      const transport = new WebSocketTransport();

      const result = await transport.connect(model);

      expect(result).toBe(connection);
    });
  });
});
