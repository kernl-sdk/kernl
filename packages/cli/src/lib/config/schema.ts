import { z } from "zod";

export const OFFICIAL_REGISTRY =
  "https://registry.kernl.sh/toolkits/{name}.json";

export const KernlConfigSchema = z.object({
  $schema: z.string().optional(),
  toolkitsDir: z.string().optional().default("src/toolkits"),
  aliases: z
    .object({
      toolkits: z.string().optional().default("@/toolkits"),
    })
    .optional()
    .default({ toolkits: "@/toolkits" }),
  registries: z
    .record(z.string(), z.string())
    .optional()
    .default({ "@kernl": OFFICIAL_REGISTRY }),
});

export type KernlConfig = z.infer<typeof KernlConfigSchema>;
