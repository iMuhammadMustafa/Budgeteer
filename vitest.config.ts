import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit + integration tests for pure-TS logic (services, utils, repositories).
// Deliberately NOT wired to Metro/React Native — targets here must be free of
// react-native imports. Component tests, if added later, get their own project.
export default defineConfig({
    // Mirror tsconfig's "@/*" -> "./*" path alias so tests resolve source imports.
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.{test,spec}.ts"],
        exclude: ["node_modules/**", "e2e/**", "dist/**"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            // Only logic we intend to hold to a bar. Expand as suites land.
            include: ["src/utils/**", "src/services/**"],
            exclude: ["src/**/*.{test,spec}.ts"],
        },
    },
});
