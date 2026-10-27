import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.test.js"],
    setupFiles: "./vitest.setup.js",
    coverage: {
      include: ["src/**/*.js"],
      exclude: ["src/tests/**"],
      // A floor just below today's numbers: coverage may only go up
      thresholds: { lines: 95, statements: 95, functions: 95, branches: 88 },
    },
  },
});
