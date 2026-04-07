import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Tests run against Expo web at http://localhost:8081
export default defineConfig({
    testDir: "./e2e/tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Provide 2 workers in CI, but allow unlimited locally (Playwright bounds automatically based on CPU)
    workers: process.env.CI ? 2 : undefined,
    // 60s default test timeout — cloud tests need extra time for network latency
    timeout: 60000,

    // Concise terminal output + HTML for deep-diving failures
    reporter: [
        ["list", { printSteps: false }],
        ["html", { open: "never" }],
    ],

    use: {
        baseURL: "http://localhost:8081",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        // Generous action timeout for slow SQLite init
        actionTimeout: 15000,
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    webServer: {
        command: "npm run web",
        url: "http://localhost:8081",
        reuseExistingServer: !process.env.CI,
        timeout: 180000, // 3 min for server startup
    },
});
