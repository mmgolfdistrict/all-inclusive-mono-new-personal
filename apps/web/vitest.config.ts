import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },

    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "vitest.setup.ts",
        coverage: {
            provider: 'istanbul',
            reporter: ["text", "html", "lcov"],
            reportsDirectory: "./coverage",
        },
    },

    esbuild: {
        jsx: "automatic",
    },
});