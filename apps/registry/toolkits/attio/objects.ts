import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { attio, type AttioContext } from "./client";

/**
 * List all objects in the workspace.
 */
export const list = tool({
  id: "objects_list",
  description:
    "List all objects (e.g. People, Companies, custom objects) in the Attio workspace",
  parameters: z.object({}),
  async execute(ctx: Context<AttioContext>) {
    const response = await attio.objects.list();
    return response.data;
  },
});

/**
 * Get a specific object by slug or ID.
 */
export const get = tool({
  id: "objects_get",
  description: "Get details about a specific object including its attributes",
  parameters: z.object({
    object: z
      .string()
      .describe("Object slug (e.g. 'people', 'companies') or object ID"),
  }),
  async execute(ctx: Context<AttioContext>, { object }) {
    const res = await attio.objects.retrieve(object);
    return res.data;
  },
});

/**
 * Create a new custom object.
 */
export const create = tool({
  id: "objects_create",
  description: "Create a new custom object in the workspace",
  parameters: z.object({
    name: z.string().describe("Display name for the object (e.g. 'Project')"),
    plural: z.string().describe("Plural form of the name (e.g. 'Projects')"),
    slug: z
      .string()
      .describe("URL-safe identifier in snake_case (e.g. 'projects')"),
  }),
  async execute(ctx: Context<AttioContext>, { name, plural, slug }) {
    const res = await attio.objects.create({
      data: {
        singular_noun: name,
        plural_noun: plural,
        api_slug: slug,
      },
    });
    return res.data;
  },
});

/**
 * Update an object's configuration.
 */
export const update = tool({
  id: "objects_update",
  description: "Update an object's display name or other settings",
  parameters: z.object({
    object: z.string().describe("Object slug or ID to update"),
    name: z.string().optional().describe("New singular display name"),
    plural: z.string().optional().describe("New plural display name"),
  }),
  async execute(ctx: Context<AttioContext>, { object, name, plural }) {
    const data: Record<string, string> = {};
    if (name) data.singular_noun = name;
    if (plural) data.plural_noun = plural;

    const res = await attio.objects.update(object, { data });
    return res.data;
  },
});

export const objects = new Toolkit<AttioContext>({
  id: "objects",
  description: "Attio CRM object schema management",
  tools: [list, get, create, update],
});
