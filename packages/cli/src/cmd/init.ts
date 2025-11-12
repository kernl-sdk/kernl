import { mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { Command } from "commander";
import { green, cyan } from "picocolors";
import prompts from "prompts";

import { isWriteable, isFolderEmpty } from "@/lib/validate";
import { installTemplate } from "@/lib/install-template";
import type { PackageManager } from "@/lib/install";

interface InitOptions {
  skipInstall: boolean;
  skipGit: boolean;
  packageManager?: PackageManager;
}

export const init = new Command("init")
  .description("Initialize a new kernl application")
  .argument("<project-name>", "Name of the project")
  .option("--skip-install", "Skip dependency installation", false)
  .option("--skip-git", "Skip git initialization", false)
  .option(
    "-p, --package-manager <manager>",
    "Package manager to use (pnpm, npm, yarn)",
  )
  .action(_init);

/**
 * @action
 *
 * Creates a new kernl project in the current directory.
 */
async function _init(projectName: string, options: InitOptions) {
  try {
    const root = resolve(projectName);
    const name = basename(root);

    // validate parent directory is writable
    if (!(await isWriteable(dirname(root)))) {
      throw new Error(
        "The application path is not writable, please check folder permissions and try again.",
      );
    }

    // create directory + validate empty
    mkdirSync(root, { recursive: true });
    if (!isFolderEmpty(root, name)) {
      process.exit(1);
    }

    // prompt for package manager if not provided
    let packageManager: PackageManager = options.packageManager || "pnpm";
    if (!options.packageManager) {
      const input = await prompts({
        type: "select",
        name: "packageManager",
        message: "Which package manager do you want to use?",
        choices: [
          { title: "pnpm", value: "pnpm" },
          { title: "npm", value: "npm" },
          { title: "yarn", value: "yarn" },
        ],
        initial: 0,
      });

      if (!input.packageManager) {
        console.log("\nOperation cancelled.");
        process.exit(0);
      }

      packageManager = input.packageManager;
    }

    // install template
    console.log(`Creating a new Kernl app in ${green(root)}.`);
    console.log();

    await installTemplate({
      appName: name,
      root,
      packageManager,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit,
    });

    // success!
    console.log(`${green("Success!")} Created ${name} at ${root}`);
    console.log();
    console.log("Inside that directory, you can run several commands:");
    console.log();
    console.log(
      cyan(`  ${packageManager} ${packageManager === "npm" ? "run " : ""}dev`),
    );
    console.log("    Starts the development server with watch mode.");
    console.log();
    console.log(cyan(`  ${packageManager} start`));
    console.log("    Runs the application.");
    console.log();
    console.log("We suggest that you begin by typing:");
    console.log();
    console.log(cyan(`  cd ${projectName}`));
    console.log(
      cyan(`  ${packageManager} ${packageManager === "npm" ? "run " : ""}dev`),
    );
    console.log();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "An error occurred");
    process.exit(1);
  }
}
