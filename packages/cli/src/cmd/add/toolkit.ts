import { Command } from "commander";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { green, cyan, yellow, red } from "picocolors";
import prompts from "prompts";

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
      console.error(red(`Failed to add ${name}: ${msg}`));
      console.error();
    }
  }

  // install dependencies for the toolkit
  if (allDeps.length) {
    console.log(`\nInstalling dependencies...`);
    await addDeps(allDeps, process.cwd());
  }

  if (errors.length > 0 && errors.length < names.length) {
    console.log(`\n${yellow("Some toolkits failed:")}`);
    for (const e of errors) console.log(`  ${red("×")} ${e}`);
  }
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
  console.log(`Fetching ${cyan(name)}...`);

  const item = await fetchItem(url);
  const targetDir = join(config.toolkitsDir, item.name);

  // check if exists
  if (existsSync(targetDir)) {
    if (opts.yes) {
      console.log(yellow(`${item.name} already exists, skipping`));
      return [];
    }

    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `${item.name} already exists. Overwrite?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(`Skipped ${item.name}`);
      return [];
    }
  }

  console.log(`Adding ${green(item.title || item.name)}...\n`);

  // write files
  for (const file of item.files) {
    const rel = relPath(file.path);
    const target = join(config.toolkitsDir, rel);
    const content = transformImports(file.content, config.aliases.toolkits);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    console.log(`  ${green("+")} ${rel}`);
  }

  // show env vars
  if (item.env.length) {
    console.log(`\n  Required env vars:`);
    for (const e of item.env) {
      console.log(`    ${yellow("[ ]")} ${e}`);
    }
  }

  console.log();
  return item.dependencies;
}
