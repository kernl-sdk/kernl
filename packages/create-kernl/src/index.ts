#!/usr/bin/env node
import { Command } from "commander";
import { create, type CreateOptions } from "@kernl-sdk/cli/create";

const program = new Command()
  .name("create-kernl")
  .description("Create a new kernl application")
  .argument("[name]", "Project name")
  .option("-c, --cwd <cwd>", "Working directory", process.cwd())
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-d, --defaults", "Use default configuration")
  .option("-f, --force", "Force overwrite existing files")
  .option("--pm <pm>", "Package manager (npm/pnpm/yarn/bun)")
  .option("-s, --silent", "Mute output")
  .action(async (name: string | undefined, options: CreateOptions) => {
    try {
      await create({ ...options, name });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
