import { mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import color from "picocolors";
import * as p from "@clack/prompts";

import { isWriteable, isFolderEmpty } from "@/lib/validate";
import { installTemplate } from "@/lib/install-template";
import type { PackageManager } from "@/lib/install";

export interface CreateOptions {
  cwd?: string;
  name?: string;
  yes?: boolean;
  defaults?: boolean;
  force?: boolean;
  pm?: PackageManager;
  silent?: boolean;
}

/**
 * Programmatic entrypoint for creating a new kernl project.
 * Used by create-kernl package.
 */
export async function create(options: CreateOptions = {}) {
  const silent = options.silent ?? false;
  const skipPrompts = options.yes || options.defaults;
  const basedir = options.cwd ? resolve(options.cwd) : process.cwd();

  if (!silent) {
    p.intro(color.bgCyan(color.black(" create-kernl ")));
  }

  // resolve project name
  let target = options.name;
  if (!target) {
    if (skipPrompts) {
      target = "my-kernl-app";
    } else {
      const name = await p.text({
        message: "What is your project named?",
        placeholder: "my-kernl-app",
        defaultValue: "my-kernl-app",
      });

      if (p.isCancel(name)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
      target = name;
    }
  }

  const root = resolve(basedir, target!);
  const name = basename(root);

  // validate parent directory is writable
  if (!(await isWriteable(dirname(root)))) {
    p.cancel("The application path is not writable, please check folder permissions.");
    process.exit(1);
  }

  // create directory + validate empty (unless force)
  mkdirSync(root, { recursive: true });
  if (!options.force && !isFolderEmpty(root, name, silent)) {
    process.exit(1);
  }

  // resolve package manager
  let pm: PackageManager = options.pm || "pnpm";
  if (!options.pm && !skipPrompts) {
    const selected = await p.select({
      message: "Which package manager do you want to use?",
      options: [
        { value: "pnpm", label: "pnpm" },
        { value: "npm", label: "npm" },
        { value: "yarn", label: "yarn" },
        { value: "bun", label: "bun" },
      ],
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    pm = selected as PackageManager;
  }

  await installTemplate({
    appName: name,
    root,
    packageManager: pm,
    skipInstall: false,
    skipGit: false,
    silent,
  });

  if (!silent) {
    const devCmd = pm === "npm" ? "npm run dev" : `${pm} dev`;

    p.note(
      `cd ${target}\n${devCmd}`,
      "Next steps",
    );

    p.outro(`Problems? ${color.underline(color.cyan("https://github.com/kernl-sdk/kernl/issues"))}`);
  }
}
