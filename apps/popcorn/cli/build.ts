#!/usr/bin/env bun
/**
 * Build script for compiled popcorn binary.
 * Uses Solid transform plugin during bundling.
 *
 * Usage:
 *   bun run build.ts                     # Build for current platform
 *   bun run build.ts --target darwin-arm64
 */

import solidPlugin from "@opentui/solid/bun-plugin";
import { realpathSync } from "fs";
import { resolve, relative } from "path";
import pkg from "./package.json";

// Parse --target argument
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const targetFlag = process.argv.indexOf("--target");
const target =
  targetArg?.split("=")[1] ??
  (targetFlag !== -1 ? process.argv[targetFlag + 1] : null) ??
  `${process.platform}-${process.arch}`;

const dir = import.meta.dirname;
const workerAbsolute = realpathSync(resolve(dir, "./src/worker.ts"));
const workerRelative = relative(dir, workerAbsolute).replaceAll("\\", "/");
const bunfsRoot = "/$bunfs/root/";

const result = await Bun.build({
  conditions: ["browser"],
  tsconfig: "./tsconfig.json",
  plugins: [solidPlugin],
  sourcemap: "external",
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    // @ts-expect-error - bun types not up to date
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    target: `bun-${target}` as "bun",
    outfile: "dist/popcorn",
  },
  entrypoints: ["./src/index.ts", workerAbsolute],
  define: {
    POPCORN_VERSION: `'${pkg.version}'`,
    POPCORN_WORKER_PATH: `'${bunfsRoot}${workerRelative}'`,
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Built: ./dist/popcorn");
