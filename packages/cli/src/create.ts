import { mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import color from "picocolors";
import * as p from "@clack/prompts";

import { isWriteable, isFolderEmpty } from "@/lib/validate";
import { installTemplate, type Provider } from "@/lib/install-template";
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

  // 1. resolve project name
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

  // 2. validate parent directory is writable
  if (!(await isWriteable(dirname(root)))) {
    p.cancel(
      "The application path is not writable, please check folder permissions.",
    );
    process.exit(1);
  }

  // 3. create directory + validate empty (unless force)
  mkdirSync(root, { recursive: true });
  if (!options.force && !isFolderEmpty(root, name, silent)) {
    process.exit(1);
  }

  // 4. resolve package manager
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

  // 5. select AI provider (required)
  let provider: Provider = "anthropic";
  if (!skipPrompts) {
    const selected = await p.select({
      message: "Select a default provider:",
      options: [
        { value: "anthropic", label: "Anthropic" },
        { value: "openai", label: "OpenAI" },
        { value: "google", label: "Google" },
      ],
    });

    if (p.isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    provider = selected as Provider;
  }

  // 6. prompt for API key (optional)
  let apiKey: string | undefined;
  if (!skipPrompts) {
    const envVars: Record<Provider, string> = {
      openai: "OPENAI_API_KEY",
      anthropic: "ANTHROPIC_API_KEY",
      google: "GOOGLE_GENERATIVE_AI_API_KEY",
    };

    const key = await p.text({
      message: `Enter your ${envVars[provider]} (optional):`,
      placeholder: "Press Enter to skip",
    });

    if (!p.isCancel(key) && key) {
      apiKey = key;
    }
  }

  await installTemplate({
    appName: name,
    root,
    packageManager: pm,
    provider,
    apiKey,
    silent,
  });

  if (!silent) {
    const devCmd = pm === "npm" ? "npm run dev" : `${pm} dev`;

    p.note(`cd ${target}\n${devCmd}`, "Next steps");

    p.outro(
      `Problems? ${color.underline(color.cyan("https://github.com/kernl-sdk/kernl/issues"))}`,
    );
  }
}
