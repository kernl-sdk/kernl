/**
 * Worker process that embeds server0.
 *
 * Receives RPC calls from the main thread and forwards them to the Hono app.
 * This allows the TUI to communicate with the server without binding to a port.
 */

// suppress console output - it bleeds through to the TUI
const noop = () => {};
console.log = noop;
console.error = noop;
console.warn = noop;
console.info = noop;
console.debug = noop;

import { build } from "server0/app";
import { Rpc } from "./rpc";
import * as events from "server0/state/events";

// Build the Hono app
const app = build();

// Event subscribers - map of directory to callback
const subscribers = new Map<string, () => void>();

/**
 * RPC methods exposed to the main thread.
 */
export const rpc = {
  /**
   * Forward an HTTP request to the Hono app.
   */
  async fetch(input: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }) {
    const request = new Request(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.body,
    });

    const response = await app.fetch(request);
    const body = await response.text();

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    };
  },

  /**
   * Subscribe to events for a directory.
   * Events will be emitted via Rpc.emit("event", ...).
   */
  async subscribe(input: { directory: string }) {
    // Clean up existing subscription if any
    const existing = subscribers.get(input.directory);
    if (existing) {
      existing();
    }

    // Subscribe to events from the server
    const unsubscribe = events.subscribe((event) => {
      // Forward event to TUI via RPC
      Rpc.emit("event", event.payload);
    });

    subscribers.set(input.directory, unsubscribe);

    return { subscribed: true };
  },

  /**
   * Gracefully shutdown the worker.
   */
  async shutdown() {
    // Clean up any subscriptions
    for (const cleanup of subscribers.values()) {
      cleanup();
    }
    subscribers.clear();
  },
};

// Start listening for RPC calls
Rpc.listen(rpc);
