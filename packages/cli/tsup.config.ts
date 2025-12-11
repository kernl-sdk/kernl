import { defineConfig } from "tsup";

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
});
