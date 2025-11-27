import type { ThreadStore } from "@/storage";
import { isPublicEvent } from "@/thread/utils";
import type { MThreadEvent } from "@/api/models";
import type { ThreadEvent } from "@/thread/types";

/**
 * Events subresource for threads.
 *
 * Provides access to the event log for an individual thread, filtered down to
 * events that make sense to surface to callers (messages, tool calls/results, etc.).
 */
export class RThreadEvents {
  constructor(private readonly store: ThreadStore) {}

  /**
   * List events for a thread.
   *
   * Returns only public events – internal system events are filtered out.
   *
   * @param tid - Thread ID
   */
  async list(tid: string): Promise<MThreadEvent[]> {
    const events: ThreadEvent[] = await this.store.history(tid);
    return events.filter(isPublicEvent).map((e) => e as MThreadEvent);
  }
}
