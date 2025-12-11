import { z } from "zod";

const RegistryFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const RegistryItemSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: z.enum(["registry:toolkit", "registry:agent", "registry:skill"]),
  title: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).default([]),
  env: z.array(z.string()).default([]),
  files: z.array(RegistryFileSchema).min(1),
  registryVersion: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type RegistryFile = z.infer<typeof RegistryFileSchema>;
export type RegistryItem = z.infer<typeof RegistryItemSchema>;
