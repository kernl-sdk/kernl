import * as p from "@clack/prompts";

import { RegistryItemSchema, type RegistryItem } from "./schema";
import type { KernlConfig } from "@/lib/config/schema";

/**
 * Build registry URL from name + config.
 * "gmail" → https://registry.kernl.sh/toolkits/gmail.json
 * "@myco/auth" → lookup @myco in config.registries
 */
export function buildUrl(name: string, config: KernlConfig): string {
  const match = name.match(/^@([^/]+)\/(.+)$/);

  if (match) {
    const [, scope, toolkit] = match;
    const template = config.registries[`@${scope}`];
    if (!template) {
      p.log.error(`Unknown registry: @${scope}`);
      p.log.message(`Add it to kernl.json:`);
      p.log.message(`  "registries": { "@${scope}": "https://..." }`);
      process.exit(1);
    }
    return template.replace("{name}", toolkit);
  }

  const template = config.registries["@kernl"];
  return template.replace("{name}", name);
}

/**
 * Fetch and validate a registry item.
 */
export async function fetchItem(url: string): Promise<RegistryItem> {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Toolkit not found");
    }
    throw new Error(`HTTP ${res.status}`);
  }

  const json = await res.json();
  const result = RegistryItemSchema.safeParse(json);

  if (!result.success) {
    throw new Error("Invalid registry response");
  }

  return result.data;
}
