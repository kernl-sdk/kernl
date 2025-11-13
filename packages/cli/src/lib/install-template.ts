import os from "os";
import { join } from "path";
import { writeFile } from "fs/promises";
import { bold, cyan } from "picocolors";

import { copy } from "@/lib/copy";
import { install, type PackageManager } from "@/lib/install";
import { tryGitInit } from "@/lib/git";

interface InstallTemplateOptions {
  appName: string;
  root: string;
  packageManager: PackageManager;
  skipInstall: boolean;
  skipGit: boolean;
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
}: InstallTemplateOptions): Promise<void> {
  console.log(bold(`Using ${packageManager}.`));
  console.log();

  // Copy template files
  const templatePath = join(__dirname, "../../templates/default");
  await copy(["**"], root, {
    cwd: templatePath,
    parents: true,
    rename(name) {
      // Rename gitignore to .gitignore
      if (name === "gitignore") {
        return ".gitignore";
      }
      return name;
    },
  });

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
      "@kernl/core": "latest",
      "@kernl/ai": "latest",
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
    console.log("Installing dependencies:");
    for (const dependency in packageJson.dependencies) {
      console.log(`- ${cyan(dependency)}`);
    }
    console.log();
    console.log("Installing devDependencies:");
    for (const dependency in packageJson.devDependencies) {
      console.log(`- ${cyan(dependency)}`);
    }
    console.log();

    await install(root, packageManager);
    console.log();
  }

  // Initialize git
  if (!skipGit && tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }
}
