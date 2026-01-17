import { BusEvent } from "./bus/bus-event"
import z from "zod"

export namespace Installation {
  export const VERSION = "0.1.0"

  export const Event = {
    Updated: BusEvent.define(
      "installation.updated",
      z.object({
        version: z.string(),
      })
    ),
    UpdateAvailable: BusEvent.define(
      "installation.update-available",
      z.object({
        version: z.string(),
      })
    ),
  }

  export function getVersion(): string {
    return VERSION
  }
}
