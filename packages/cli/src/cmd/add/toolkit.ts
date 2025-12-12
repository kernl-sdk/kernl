import { Command } from "commander";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import * as p from "@clack/prompts";
import color from "picocolors";

/* lib */
import { loadcfg } from "@/lib/config/load";
import { buildUrl, fetchItem } from "@/registry/fetch";
import { transformImports, relPath } from "@/registry/transform";
import { addDeps } from "@/lib/install";

interface Options {
  yes?: boolean;
}

export const toolkit = new Command("toolkit")
  .description("Add a toolkit from the registry")
  .argument("<names...>", "Toolkit name(s)")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(addToolkit);

/**
 * @action
 *
 * Add one or more toolkits from the registry.
 */
async function addToolkit(names: string[], opts: Options) {
  p.intro(color.bgCyan(color.black(" kernl add ")));

  const config = await loadcfg();
  const errors: string[] = [];
  const allDeps: string[] = [];

  for (const name of names) {
    try {
      const deps = await installToolkit(name, config, opts);
      allDeps.push(...deps);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${name}: ${msg}`);
      p.log.error(`Failed to add ${name}: ${msg}`);
    }
  }

  // install dependencies for the toolkit
  if (allDeps.length) {
    const s = p.spinner();
    s.start("Installing dependencies");
    await addDeps(allDeps, process.cwd());
    s.stop("Dependencies installed");
  }

  if (errors.length > 0 && errors.length < names.length) {
    p.log.warn("Some toolkits failed:");
    for (const e of errors) {
      p.log.message(`  ${color.red("×")} ${e}`);
    }
  }

  p.outro("Done!");
}

/**
 * Fetch a toolkit from registry and write files to disk.
 * Returns the list of dependencies to install.
 */
async function installToolkit(
  name: string,
  config: Awaited<ReturnType<typeof loadcfg>>,
  opts: Options,
): Promise<string[]> {
  const url = buildUrl(name, config);

  const s = p.spinner();
  s.start(`Fetching ${name}`);

  let item;
  try {
    item = await fetchItem(url);
  } catch (err) {
    s.stop(`Failed to fetch ${name}`);
    throw err;
  }

  s.stop(`Fetched ${item.title || item.name}`);

  const targetDir = join(config.toolkitsDir, item.name);

  // check if exists
  if (existsSync(targetDir)) {
    if (opts.yes) {
      p.log.warn(`${item.name} already exists, skipping`);
      return [];
    }

    const overwrite = await p.confirm({
      message: `${item.name} already exists. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.log.step(`Skipped ${item.name}`);
      return [];
    }
  }

  // write files
  for (const file of item.files) {
    const rel = relPath(file.path);
    const target = join(config.toolkitsDir, rel);
    const content = transformImports(file.content, config.aliases.toolkits);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    p.log.step(`${color.green("+")} ${rel}`);
  }

  // show env vars
  if (item.env.length) {
    p.log.message(color.dim("Required env vars:"));
    for (const e of item.env) {
      p.log.message(`  ${color.yellow("○")} ${e}`);
    }
  }

  return item.dependencies;
}
