import os from "os";
import { join } from "path";
import { writeFile } from "fs/promises";
import * as p from "@clack/prompts";

import { copy } from "@/lib/copy";
import { install, type PackageManager } from "@/lib/install";
import { tryGitInit } from "@/lib/git";

interface InstallTemplateOptions {
  appName: string;
  root: string;
  packageManager: PackageManager;
  skipInstall: boolean;
  skipGit: boolean;
  silent?: boolean;
}

/**
 * Install the default kernl template to the target directory.
 */
export async function installTemplate({
  appName,
  root,
  packageManager,
  skipInstall,
  skipGit,
  silent = false,
}: InstallTemplateOptions): Promise<void> {
  // Copy template files (path relative to dist/ after bundling)
  const templatePath = join(__dirname, "../templates/default");
  await copy(["**"], root, {
    cwd: templatePath,
    parents: true,
    rename(name) {
      // Rename dotfiles (can't include dots in template names)
      if (name === "gitignore") return ".gitignore";
      if (name === "env.example") return ".env.example";
      return name;
    },
  });

  if (!silent) {
    p.log.step("Project structure created");
  }

  // Generate package.json
  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      start: "tsx src/index.ts",
    },
    dependencies: {
      kernl: "latest",
      "@kernl-sdk/ai": "latest",
      zod: "^4.1.12",
    },
    devDependencies: {
      "@types/node": "^24.10.0",
      tsx: "^4.7.0",
      typescript: "^5.9.2",
    },
  };

  await writeFile(
    join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL,
  );

  // Install dependencies
  if (!skipInstall) {
    const s = p.spinner();
    s.start(`Installing dependencies via ${packageManager}`);

    try {
      await install(root, packageManager, true); // always silent since we have spinner
      s.stop(`Dependencies installed via ${packageManager}`);
    } catch (error) {
      s.stop("Failed to install dependencies");
      throw error;
    }
  }

  // Initialize git
  if (!skipGit && tryGitInit(root)) {
    if (!silent) {
      p.log.step("Initialized git repository");
    }
  }
}
