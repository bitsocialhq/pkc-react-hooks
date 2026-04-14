import { defineConfig } from "vitest/config";
import path from "path";

const isCoverageRun = process.argv.some((arg) => arg.startsWith("--coverage."));

const config = {
  test: {
    // silence sourcemap warnings
    sourcemap: false,

    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    reporter: isCoverageRun ? ["default"] : ["default", "json"],
    outputFile: isCoverageRun ? undefined : "./.vitest-reports/tests.json",
    server: { deps: { inline: true } },
    // Coverage runs are more stable when the large hooks/stores suite avoids fork teardown
    // and stays on a single worker.
    pool: isCoverageRun ? "threads" : undefined,
    fileParallelism: isCoverageRun ? false : undefined,
    maxWorkers: isCoverageRun ? 1 : undefined,
    coverage: {
      exclude: ["lib/pkc-js/pkc-js-mock-content.ts"],
    },
    alias: {
      // mock pkc-js because it throws in jsdom
      "@pkcprotocol/pkc-js": path.resolve(__dirname, "vitest-empty-alias.js"),
    },
    root: "src/",
    setupFiles: [path.resolve(__dirname, "vitest.setup.js")],
  },
};

// handle pkc-js-mock-content.donttest.ts
const mockContentTestPath = "src/lib/pkc-js/pkc-js-mock-content.donttest.ts";
if (process.argv.includes(mockContentTestPath)) {
  config.test.include = ["../" + mockContentTestPath];
}

export default defineConfig(config);
