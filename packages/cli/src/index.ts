#!/usr/bin/env node

import { Command } from "commander";
import { init } from "@/cmd/init";

/**
 * Main CLI entrypoint.
 */
async function main() {
  const cli = new Command()
    .name("kernl")
    .description("kernl::CLI")
    .version("0.1.0", "-v, --version", "display the version number");

  cli.addCommand(init);
  // cli.addCommand(list);
  // cli.addCommand(add);
  // cli.addCommand(view);
  // cli.addCommand(search);

  cli.parse();
}

main();
