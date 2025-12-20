import { defineConfig } from "tsup";
import { readFileSync } from "fs";
import { resolve } from "path";

const kernlPkg = JSON.parse(
  readFileSync(resolve(__dirname, "../kernl/package.json"), "utf-8"),
);
const aiPkg = JSON.parse(
  readFileSync(resolve(__dirname, "../providers/ai/package.json"), "utf-8"),
);

export default defineConfig({
  entry: {
    index: "src/index.ts",
    create: "src/create.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  shims: true,
  splitting: false,
  define: {
    KERNL_VERSION: JSON.stringify(kernlPkg.version),
    KERNL_AI_VERSION: JSON.stringify(aiPkg.version),
  },
});
