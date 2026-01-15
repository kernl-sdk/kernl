import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";
import type {
  TaskCreateParams,
  TaskUpdateParams,
} from "attio-crm/resources/tasks";

import { attio, type AttioContext } from "./client";

/**
 * List tasks, optionally filtered by status or assignee.
 */
export const list = tool({
  id: "attio_tasks_list",
  description: "List tasks, optionally filtered by status or linked record",
  parameters: z.object({
    linkedObject: z
      .string()
      .optional()
      .describe("Filter by linked object slug (e.g. 'people', 'companies')"),
    linkedRecordId: z
      .string()
      .optional()
      .describe("Filter by linked record ID (requires linkedObject)"),
    isCompleted: z.boolean().optional().describe("Filter by completion status"),
    limit: z
      .number()
      .min(1)
      .max(500)
      .default(50)
      .describe("Max tasks to return"),
    offset: z.number().min(0).default(0).describe("Number of tasks to skip"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { linkedObject, linkedRecordId, isCompleted, limit, offset },
  ) {
    const response = await attio.tasks.list({
      limit,
      offset,
      is_completed: isCompleted,
      ...(linkedObject &&
        linkedRecordId && {
          linked_object: linkedObject,
          linked_record_id: linkedRecordId,
        }),
    });
    return response.data;
  },
});

/**
 * Get a specific task by ID.
 */
export const get = tool({
  id: "attio_tasks_get",
  description: "Get a specific task by its ID",
  parameters: z.object({
    taskId: z.string().describe("The task ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { taskId }) {
    const response = await attio.tasks.retrieve(taskId);
    return response.data;
  },
});

/**
 * Create a new task.
 */
export const create = tool({
  id: "attio_tasks_create",
  description: "Create a new task, optionally linked to a record",
  parameters: z.object({
    content: z.string().describe("Task description/content (max 2000 chars)"),
    deadline: z
      .string()
      .nullable()
      .default(null)
      .describe("Due date in ISO 8601 format (e.g. '2024-12-31') or null"),
    isCompleted: z
      .boolean()
      .default(false)
      .describe("Whether task starts as completed"),
    linkedObject: z
      .string()
      .optional()
      .describe("Object slug to link this task to"),
    linkedRecordId: z
      .string()
      .optional()
      .describe("Record ID to link this task to"),
    assigneeEmails: z
      .array(z.string())
      .optional()
      .describe("Array of workspace member email addresses to assign"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    {
      content,
      deadline,
      isCompleted,
      linkedObject,
      linkedRecordId,
      assigneeEmails,
    },
  ) {
    // Build linked records with explicit local type (SDK has type collision)
    type LinkedRecord = { target_object: string; target_record_id: string };
    const linkedRecords: LinkedRecord[] = [];
    if (linkedObject && linkedRecordId) {
      linkedRecords.push({
        target_object: linkedObject,
        target_record_id: linkedRecordId,
      });
    }

    // Build assignees with explicit local type
    type Assignee = { workspace_member_email_address: string };
    const assignees: Assignee[] =
      assigneeEmails?.map((email) => ({
        workspace_member_email_address: email,
      })) ?? [];

    const response = await attio.tasks.create({
      data: {
        content,
        format: "plaintext",
        deadline_at: deadline,
        is_completed: isCompleted,
        linked_records:
          linkedRecords as TaskCreateParams.Data["linked_records"],
        assignees: assignees as TaskCreateParams.Data["assignees"],
      },
    });
    return response.data;
  },
});

/**
 * Update a task.
 */
export const update = tool({
  id: "attio_tasks_update",
  description: "Update a task's deadline or completion status",
  parameters: z.object({
    taskId: z.string().describe("The task ID to update"),
    deadline: z
      .string()
      .nullable()
      .optional()
      .describe("New due date in ISO 8601 format, or null to clear"),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Mark task as completed or not"),
  }),
  async execute(ctx: Context<AttioContext>, { taskId, deadline, isCompleted }) {
    const data: TaskUpdateParams.Data = {};
    if (deadline !== undefined) data.deadline_at = deadline;
    if (isCompleted !== undefined) data.is_completed = isCompleted;

    const response = await attio.tasks.update(taskId, { data });
    return response.data;
  },
});

/**
 * Delete a task.
 */
export const remove = tool({
  id: "attio_tasks_delete",
  description: "Delete a task",
  parameters: z.object({
    taskId: z.string().describe("The task ID to delete"),
  }),
  async execute(ctx: Context<AttioContext>, { taskId }) {
    await attio.tasks.delete(taskId);
    return { success: true, taskId };
  },
});

export const tasks = new Toolkit<AttioContext>({
  id: "attio_tasks",
  description: "Attio CRM task management",
  tools: [list, get, create, update, remove],
});
