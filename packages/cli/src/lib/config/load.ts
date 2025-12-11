import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import { red } from "picocolors";

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
    console.error(red(`Error: ${CONFIG_FILE} not found.`));
    console.error();
    console.error(
      `Run ${red("kernl init <project>")} to create a new project, or create ${CONFIG_FILE}:`,
    );
    console.error();
    console.error(`  {`);
    console.error(`    "toolkitsDir": "src/toolkits",`);
    console.error(`    "aliases": { "toolkits": "@/toolkits" },`);
    console.error(
      `    "registries": { "@kernl": "https://registry.kernl.sh/toolkits/{name}.json" }`,
    );
    console.error(`  }`);
    process.exit(1);
  }

  const raw = await readFile(path, "utf-8");
  const json = JSON.parse(raw);
  const result = KernlConfigSchema.safeParse(json);

  if (!result.success) {
    console.error(red(`Error: Invalid ${CONFIG_FILE}`));
    console.error();
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
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
