import fs from "fs";
import path from "path";
import { defineConfig, devices } from "@playwright/test";

// Load .env.test if present (optional — local/demo E2E needs no secrets; only
// cloud journeys read credentials). Avoids a hard dependency on `dotenv`.
const envTestPath = path.resolve(__dirname, ".env.test");
if (fs.existsSync(envTestPath)) {
  for (const line of fs.readFileSync(envTestPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Tests run against Expo web at http://localhost:8081
export default defineConfig({
  testDir: "./e2e/tests",
  // Legacy specs (e2e/tests/legacy/**) target the pre-redesign UI (role=dialog
  // forms, dropdown pickers, hamburger-menu nav) and are quarantined pending
  // per-screen migration to the injection harness. See e2e/tests/legacy/README.md.
  testIgnore: "**/legacy/**",
  // Fresh browser context per test (Playwright default) gives a fresh OPFS
  // (⇒ fresh local SQLite) and fresh localStorage (⇒ fresh AsyncStorage), so
  // tests are isolated and can run fully parallel — no more serial describes.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // 30s per test — the static export + injection harness lands in <2s; only
  // heavy data journeys approach this.
  timeout: 30000,

  reporter: [
    ["list", { printSteps: false }],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Tight action timeout — web-first assertions replace the old hard waits.
    actionTimeout: 5000,
  },

  projects: [
    // Local SQLite backend — runs the full journey suite. This is the
    // default target and the only one that needs no external services.
    {
      name: "chromium-local",
      use: { ...devices["Desktop Chrome"] },
      // Cloud-only journeys don't apply to the local backend.
      grepInvert: /@cloud-only/,
    },
    // Cloud (Supabase) backend — runs only auth/realtime/RLS-adjacent
    // journeys tagged @cloud. Self-skips per-test when creds are absent.
    {
      name: "chromium-cloud",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@local-only/,
    },
    // Mobile viewport smoke — a thin, viewport-agnostic slice tagged
    // @mobile (app entry + seeded landing). Desktop-sidebar navigation is
    // hidden behind a drawer on this viewport; mobile-nav journeys are a
    // documented follow-up, so the mobile slice stays entry-only for now.
    {
      name: "mobile-smoke",
      use: { ...devices["Pixel 5"] },
      grep: /@mobile/,
      grepInvert: /@cloud-only/,
    },
  ],

  // Phase 5.3: serve the prebuilt static export (startup ~2s) instead of the
  // cold Metro dev server (~3min). Set PW_DEV_SERVER=1 to fall back to the dev
  // server for HMR debugging. The static path requires `npm run web:export`
  // first (CI builds it; locally `npm run web:export` once).
  webServer: process.env.PW_DEV_SERVER
    ? {
        command: "npm run web",
        url: "http://localhost:8081",
        reuseExistingServer: true,
        timeout: 180000, // 3 min for dev server startup
      }
    : {
        command: "npm run web:serve",
        url: "http://localhost:8081",
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      },
});
