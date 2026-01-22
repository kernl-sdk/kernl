import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

/**
 * List meetings with cursor-based pagination.
 */
export const list = tool({
  id: "meetings_list",
  description: "List meetings with optional date filters",
  parameters: z.object({
    cursor: z.string().optional().describe("Pagination cursor for next page"),
    startsFrom: z
      .string()
      .optional()
      .describe("Filter meetings starting after this ISO timestamp"),
    startsUntil: z
      .string()
      .optional()
      .describe("Filter meetings starting before this ISO timestamp"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { cursor, startsFrom, startsUntil },
  ) {
    const res = await attio.meetings.list({
      cursor,
      ...(startsFrom && { starts_from: startsFrom }),
      ...(startsUntil && { starts_until: startsUntil }),
    });
    return res;
  },
});

/**
 * Get a specific meeting by ID.
 */
export const get = tool({
  id: "meetings_get",
  description: "Get a specific meeting by its ID",
  parameters: z.object({
    meetingId: z.string().describe("The meeting ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { meetingId }) {
    const res = await attio.meetings.retrieve(meetingId);
    return res.data;
  },
});

export const meetings = new Toolkit<AttioContext>({
  id: "meetings",
  description: "Attio CRM meeting operations",
  tools: [list, get],
});
