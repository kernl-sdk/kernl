#!/usr/bin/env node

import { createRequire } from "module";
import { Command } from "commander";
import { init } from "@/cmd/init";
import { add } from "@/cmd/add";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

/**
 * Main CLI entrypoint.
 */
async function main() {
  const cli = new Command()
    .name("kernl")
    .description("kernl::CLI")
    .version(version, "-v, --version", "display the version number");

  cli.addCommand(init);
  cli.addCommand(add);
  // cli.addCommand(list);
  // cli.addCommand(view);
  // cli.addCommand(search);

  cli.parse();
}

main();
