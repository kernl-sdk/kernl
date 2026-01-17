#!/usr/bin/env bun
/**
 * Popcorn CLI - Entry point
 *
 * Commands:
 *   popcorn [project]     Start TUI with embedded server (default)
 *   popcorn serve         Start headless HTTP server
 *   popcorn attach <url>  Connect TUI to existing server
 *   popcorn models        List available models
 *   popcorn auth          Manage authentication
 */

import { Command } from "commander";

import { popcorn } from "./cmd/default";
import { serve } from "./cmd/serve";
import { attach } from "./cmd/attach";

const cli = new Command()
  .name("popcorn")
  .description("Popcorn - AI coding assistant")
  .version("1.0.0", "-v, --version", "Display the version number");

cli.addCommand(popcorn, { isDefault: true });
cli.addCommand(serve);
cli.addCommand(attach);

cli.parse();
