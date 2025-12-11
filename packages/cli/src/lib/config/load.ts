import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import * as p from "@clack/prompts";
import color from "picocolors";

import { KernlConfigSchema, type KernlConfig } from "./schema";

const CONFIG_FILE = "kernl.json";

/**
 * Load kernl.json from cwd or ancestors.
 */
export async function loadcfg(
  cwd: string = process.cwd(),
): Promise<KernlConfig> {
  const path = findcfg(cwd);

  if (!path) {
    p.log.error(`${CONFIG_FILE} not found.`);
    p.log.message(
      `Run ${color.cyan("kernl init <project>")} to create a new project, or create ${CONFIG_FILE}:`,
    );
    p.log.message(`
  {
    "toolkitsDir": "src/toolkits",
    "aliases": { "toolkits": "@/toolkits" },
    "registries": { "@kernl": "https://registry.kernl.sh/toolkits/{name}.json" }
  }`);
    process.exit(1);
  }

  const raw = await readFile(path, "utf-8");
  const json = JSON.parse(raw);
  const result = KernlConfigSchema.safeParse(json);

  if (!result.success) {
    p.log.error(`Invalid ${CONFIG_FILE}`);
    for (const issue of result.error.issues) {
      p.log.message(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

/**
 * Walk up from cwd to find kernl.json.
 */
function findcfg(cwd: string): string | null {
  let dir = resolve(cwd);

  while (true) {
    const candidate = resolve(dir, CONFIG_FILE);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = resolve(dir, "..");
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}
