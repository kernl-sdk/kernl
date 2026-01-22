import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

// Attio expects entry values as arrays for each attribute
type AttioValues = { [key: string]: unknown[] };

// ============================================================================
// List Operations
// ============================================================================

/**
 * List all lists in the workspace.
 */
export const list = tool({
  id: "lists_list",
  description: "List all lists (pipelines, boards) in the workspace",
  parameters: z.object({}),
  async execute(ctx: Context<AttioContext>) {
    const res = await attio.lists.list();
    return res.data;
  },
});

/**
 * Get a specific list by ID or slug.
 */
export const get = tool({
  id: "lists_get",
  description: "Get details about a specific list",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
  }),
  async execute(ctx: Context<AttioContext>, { list: listId }) {
    const res = await attio.lists.retrieve(listId);
    return res.data;
  },
});

/**
 * Create a new list.
 */
export const create = tool({
  id: "lists_create",
  description: "Create a new list in the workspace",
  parameters: z.object({
    name: z.string().describe("List name"),
    slug: z.string().describe("URL-safe identifier in snake_case"),
    parentObject: z
      .string()
      .describe("Parent object slug (e.g. 'companies', 'people')"),
    workspaceAccess: z
      .enum(["full-access", "read-and-write", "read-only"])
      .default("full-access")
      .describe("Access level for all workspace members"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { name, slug, parentObject, workspaceAccess },
  ) {
    const res = await attio.lists.create({
      data: {
        name,
        api_slug: slug,
        parent_object: parentObject,
        workspace_access: workspaceAccess,
        workspace_member_access: [],
      },
    });
    return res.data;
  },
});

/**
 * Update a list.
 */
export const update = tool({
  id: "lists_update",
  description: "Update a list's name or access settings",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    name: z.string().optional().describe("New list name"),
  }),
  async execute(ctx: Context<AttioContext>, { list: listId, name }) {
    const res = await attio.lists.update(listId, {
      data: {
        ...(name && { name }),
      },
    });
    return res.data;
  },
});

// ============================================================================
// Entry Operations
// ============================================================================

/**
 * List entries in a list.
 */
export const listEntries = tool({
  id: "lists_entries_list",
  description: "List entries in a list (pipeline items)",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max entries to return"),
    offset: z.number().min(0).default(0).describe("Number of entries to skip"),
  }),
  async execute(ctx: Context<AttioContext>, { list: listId, limit, offset }) {
    const res = await attio.lists.entries.list(listId, {
      limit,
      offset,
    });
    return res.data;
  },
});

/**
 * Get a specific entry.
 */
export const getEntry = tool({
  id: "lists_entries_get",
  description: "Get a specific entry from a list",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    entryId: z.string().describe("Entry ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { list: listId, entryId }) {
    const res = await attio.lists.entries.retrieve(entryId, { list: listId });
    return res.data;
  },
});

/**
 * Create a new entry in a list.
 */
export const createEntry = tool({
  id: "lists_entries_create",
  description: "Add a record to a list as a new entry",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    parentObject: z
      .string()
      .describe("Parent object slug (e.g. 'people', 'companies')"),
    parentRecordId: z.string().describe("Record ID to add to the list"),
    entryValues: z
      .record(z.string(), z.array(z.unknown()))
      .optional()
      .describe("Optional entry attribute values"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { list: listId, parentObject, parentRecordId, entryValues },
  ) {
    const res = await attio.lists.entries.create(listId, {
      data: {
        parent_object: parentObject,
        parent_record_id: parentRecordId,
        entry_values: (entryValues ?? {}) as AttioValues,
      },
    });
    return res.data;
  },
});

/**
 * Update an entry.
 */
export const updateEntry = tool({
  id: "lists_entries_update",
  description: "Update an entry's attribute values",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    entryId: z.string().describe("Entry ID to update"),
    entryValues: z
      .record(z.string(), z.array(z.unknown()))
      .describe("Attribute values to update"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { list: listId, entryId, entryValues },
  ) {
    const res = await attio.lists.entries.update(entryId, {
      list: listId,
      data: {
        entry_values: entryValues as AttioValues,
      },
    });
    return res.data;
  },
});

/**
 * Delete an entry from a list.
 */
export const removeEntry = tool({
  id: "lists_entries_delete",
  description: "Remove an entry from a list",
  parameters: z.object({
    list: z.string().describe("List ID or slug"),
    entryId: z.string().describe("Entry ID to delete"),
  }),
  async execute(ctx: Context<AttioContext>, { list: listId, entryId }) {
    await attio.lists.entries.delete(entryId, { list: listId });
    return { success: true, list: listId, entryId };
  },
});

export const lists = new Toolkit<AttioContext>({
  id: "lists",
  description: "Attio CRM list and entry operations (pipelines, boards)",
  tools: [
    list,
    get,
    create,
    update,
    listEntries,
    getEntry,
    createEntry,
    updateEntry,
    removeEntry,
  ],
});
