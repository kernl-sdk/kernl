import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

/**
 * List notes, optionally filtered by parent record.
 */
export const list = tool({
  id: "notes_list",
  description: "List notes, optionally filtered by a parent record",
  parameters: z.object({
    parentObject: z
      .string()
      .optional()
      .describe("Filter by parent object slug (e.g. 'people', 'companies')"),
    parentRecordId: z
      .string()
      .optional()
      .describe("Filter by parent record ID (requires parentObject)"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max notes to return"),
    offset: z.number().min(0).default(0).describe("Number of notes to skip"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { parentObject, parentRecordId, limit, offset },
  ) {
    const response = await attio.notes.list({
      limit,
      offset,
      ...(parentObject &&
        parentRecordId && {
          parent_object: parentObject,
          parent_record_id: parentRecordId,
        }),
    });
    return response.data;
  },
});

/**
 * Get a specific note by ID.
 */
export const get = tool({
  id: "notes_get",
  description: "Get a specific note by its ID",
  parameters: z.object({
    noteId: z.string().describe("The note ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { noteId }) {
    const response = await attio.notes.retrieve(noteId);
    return response.data;
  },
});

/**
 * Create a new note attached to a record.
 */
export const create = tool({
  id: "notes_create",
  description: "Create a new note attached to a record",
  parameters: z.object({
    parentObject: z
      .string()
      .describe("Parent object slug (e.g. 'people', 'companies')"),
    parentRecordId: z
      .string()
      .describe("Parent record ID to attach the note to"),
    title: z.string().describe("Note title"),
    content: z.string().describe("Note content"),
    format: z
      .enum(["plaintext", "markdown"])
      .default("markdown")
      .describe("Content format: 'plaintext' or 'markdown'"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { parentObject, parentRecordId, title, content, format },
  ) {
    const res = await attio.notes.create({
      data: {
        parent_object: parentObject,
        parent_record_id: parentRecordId,
        title,
        content,
        format,
      },
    });
    return res.data;
  },
});

/**
 * Delete a note.
 */
export const remove = tool({
  id: "notes_delete",
  description: "Delete a note",
  parameters: z.object({
    noteId: z.string().describe("The note ID to delete"),
  }),
  async execute(ctx: Context<AttioContext>, { noteId }) {
    await attio.notes.delete(noteId);
    return { success: true, noteId };
  },
});

export const notes = new Toolkit<AttioContext>({
  id: "notes",
  description: "Attio CRM note operations",
  tools: [list, get, create, remove],
});
