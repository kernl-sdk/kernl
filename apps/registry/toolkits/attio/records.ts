import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

// Attio expects values as arrays for each attribute
type AttioValues = { [key: string]: unknown[] };

/**
 * List records for an object with optional filtering.
 */
export const list = tool({
  id: "attio_records_list",
  description: "List records for an object (e.g. list all people or companies)",
  parameters: z.object({
    object: z
      .string()
      .describe("Object slug (e.g. 'people', 'companies') or object ID"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max records to return (1-100)"),
    offset: z.number().min(0).default(0).describe("Number of records to skip"),
  }),
  async execute(ctx: Context<AttioContext>, { object, limit, offset }) {
    const response = await attio.objects.records.list(object, {
      limit,
      offset,
    });
    return response.data;
  },
});

/**
 * Get a specific record by ID.
 */
export const get = tool({
  id: "attio_records_get",
  description: "Get a specific record by its ID",
  parameters: z.object({
    object: z.string().describe("Object slug or ID"),
    recordId: z.string().describe("The record ID to retrieve"),
  }),
  async execute(ctx: Context<AttioContext>, { object, recordId }) {
    const response = await attio.objects.records.retrieve(recordId, { object });
    return response.data;
  },
});

/**
 * Create a new record.
 */
export const create = tool({
  id: "attio_records_create",
  description: "Create a new record for an object",
  parameters: z.object({
    object: z.string().describe("Object slug or ID"),
    values: z
      .record(z.string(), z.array(z.unknown()))
      .describe(
        "Attribute values where each key maps to an array of values (e.g. { name: [{ value: 'Acme' }], domains: [{ domain: 'acme.com' }] })",
      ),
  }),
  async execute(ctx: Context<AttioContext>, { object, values }) {
    const response = await attio.objects.records.create(object, {
      data: { values: values as AttioValues },
    });
    return response.data;
  },
});

/**
 * Update a record (append mode - adds to multi-value attributes).
 */
export const update = tool({
  id: "attio_records_update",
  description:
    "Update a record's attributes (appends to multi-value attributes)",
  parameters: z.object({
    object: z.string().describe("Object slug or ID"),
    recordId: z.string().describe("The record ID to update"),
    values: z
      .record(z.string(), z.array(z.unknown()))
      .describe("Attribute values to update (each key maps to an array)"),
  }),
  async execute(ctx: Context<AttioContext>, { object, recordId, values }) {
    const response = await attio.objects.records.updateAppend(recordId, {
      object,
      data: { values: values as AttioValues },
    });
    return response.data;
  },
});

/**
 * Delete a record.
 */
export const remove = tool({
  id: "attio_records_delete",
  description: "Delete a record",
  parameters: z.object({
    object: z.string().describe("Object slug or ID"),
    recordId: z.string().describe("The record ID to delete"),
  }),
  async execute(ctx: Context<AttioContext>, { object, recordId }) {
    await attio.objects.records.delete(recordId, { object });
    return { success: true, object, recordId };
  },
});

/**
 * Search for records across objects.
 */
export const search = tool({
  id: "attio_records_search",
  description: "Search for records across specified objects by name or text",
  parameters: z.object({
    query: z.string().describe("Search query text"),
    objects: z
      .array(z.string())
      .describe("Object slugs to search within (e.g. ['people', 'companies'])"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max results to return"),
  }),
  async execute(ctx: Context<AttioContext>, { query, objects, limit }) {
    const response = await attio.objects.records.search({
      query,
      objects,
      limit,
      request_as: { type: "workspace" },
    });
    return response.data;
  },
});

/**
 * Upsert a record - find by matching values or create if not found.
 */
export const upsert = tool({
  id: "attio_records_upsert",
  description: "Find a record by matching attribute or create it if not found",
  parameters: z.object({
    object: z.string().describe("Object slug or ID"),
    matchingAttribute: z
      .string()
      .describe(
        "Attribute slug to match on (e.g. 'email_addresses' for people)",
      ),
    values: z
      .record(z.string(), z.array(z.unknown()))
      .describe("Attribute values - must include the matching attribute value"),
  }),
  async execute(
    ctx: Context<AttioContext>,
    { object, matchingAttribute, values },
  ) {
    const response = await attio.objects.records.assert(object, {
      matching_attribute: matchingAttribute,
      data: {
        values: values as AttioValues,
      },
    });
    return response.data;
  },
});

export const records = new Toolkit<AttioContext>({
  id: "attio_records",
  description:
    "Attio CRM record operations (people, companies, custom objects)",
  tools: [list, get, create, update, remove, search, upsert],
});
