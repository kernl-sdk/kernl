import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

/**
 * Get a specific comment by ID.
 */
export const get = tool({
  id: "attio_comments_get",
  description: "Get a specific comment by its ID",
  parameters: z.object({
    commentId: z.string().describe("The comment ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { commentId }) {
    const res = await attio.comments.retrieve(commentId);
    return res.data;
  },
});

/**
 * Create a new comment on an existing thread.
 */
export const createOnThread = tool({
  id: "attio_comments_create_on_thread",
  description: "Create a new comment on an existing thread",
  parameters: z.object({
    threadId: z.string().describe("The thread ID to comment on"),
    content: z.string().describe("Comment content (plaintext)"),
    authorId: z.string().describe("Workspace member ID of the comment author"),
  }),
  async execute(ctx: Context<AttioContext>, { threadId, content, authorId }) {
    const res = await attio.comments.create({
      data: {
        thread_id: threadId,
        content,
        format: "plaintext",
        author: { id: authorId, type: "workspace-member" },
      },
    });
    return res.data;
  },
});

/**
 * Create a new comment on a record.
 */
export const createOnRecord = tool({
  id: "attio_comments_create_on_record",
  description: "Create a new top-level comment on a record",
  parameters: z.object({
    object: z.string().describe("Object slug or ID the record belongs to"),
    recordId: z.string().describe("Record ID to comment on"),
    content: z.string().describe("Comment content (plaintext)"),
    authorId: z.string().describe("Workspace member ID of the comment author"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { object, recordId, content, authorId },
  ) {
    const res = await attio.comments.create({
      data: {
        record: { object, record_id: recordId },
        content,
        format: "plaintext",
        author: { id: authorId, type: "workspace-member" },
      },
    });
    return res.data;
  },
});

/**
 * Delete a comment.
 */
export const remove = tool({
  id: "attio_comments_delete",
  description:
    "Delete a comment (deletes entire thread if it's the first comment)",
  parameters: z.object({
    commentId: z.string().describe("The comment ID to delete"),
  }),
  async execute(ctx: Context<AttioContext>, { commentId }) {
    await attio.comments.delete(commentId);
    return { success: true, commentId };
  },
});

export const comments = new Toolkit<AttioContext>({
  id: "attio_comments",
  description: "Attio CRM comment operations",
  tools: [get, createOnThread, createOnRecord, remove],
});
