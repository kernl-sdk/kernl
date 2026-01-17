import { BusEvent } from "./bus/bus-event"
import { z } from "zod"

/**
 * Session utilities and events
 */
export namespace Session {
  const DEFAULT_TITLE_PREFIX = "Session "

  export function isDefaultTitle(title: string): boolean {
    return title.startsWith(DEFAULT_TITLE_PREFIX)
  }

  export const Event = {
    Deleted: BusEvent.define(
      "session.deleted",
      z.object({
        sessionID: z.string(),
      })
    ),
    Error: BusEvent.define(
      "session.error",
      z.object({
        sessionID: z.string(),
        error: z.string(),
      })
    ),
  }
}
