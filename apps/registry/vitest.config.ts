import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["toolkits/**/__tests__/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
