#!/usr/bin/env bun

const dir = new URL("..", import.meta.url).pathname;
process.chdir(dir);

import { $ } from "bun";

// Skip OpenAPI generation - SDK types are already generated
// To regenerate, run the opencode server with `bun dev generate`

await $`rm -rf dist`;
await $`bun tsc`;
