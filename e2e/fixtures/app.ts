import { test as base, expect, Page } from "@playwright/test";

/**
 * Modern E2E harness (Phase 5.4 / 5.5).
 *
 * Replaces the landing-page-click login flow with the `?storageMode=` URL
 * injection added in Phase 5.1 and the `app-ready` readiness sentinel added in
 * Phase 5.2. Together these let a test jump straight into a seeded, authed app
 * with zero clicks and zero time-based waits, in a fresh browser context (fresh
 * OPFS ⇒ fresh local SQLite, fresh localStorage ⇒ fresh AsyncStorage) so every
 * test is isolated and the suite can run fully parallel.
 */

export type StorageMode = "local" | "cloud" | "demo";

export const cloudCredentials = {
  email:
    process.env.E2E_CLOUD_EMAIL ??
    process.env.EXPO_PUBLIC_SUPABASE_TEST_EMAIL ??
    "",
  password:
    process.env.E2E_CLOUD_PASSWORD ??
    process.env.EXPO_PUBLIC_SUPABASE_TEST_PASSWORD ??
    "",
};

/** Cloud journeys self-skip unless real Supabase test credentials are present. */
export const hasCloudCreds = Boolean(cloudCredentials.email && cloudCredentials.password);

/**
 * The storage mode a test should run in, derived from the Playwright project
 * name. `chromium-cloud` ⇒ cloud; everything else (local, mobile smoke) uses the
 * local SQLite backend. Journeys call `gotoApp(page)` with no mode and get the
 * right backend for whichever project is executing them.
 */
export function projectMode(): StorageMode {
  const name = base.info().project.name;
  return name.includes("cloud") ? "cloud" : "local";
}

/** Wait until AppInitializer has resolved storage + auth (Phase 5.2 sentinel). */
export async function awaitAppReady(page: Page): Promise<void> {
  await expect(page.getByTestId("app-ready")).toBeVisible({ timeout: 30_000 });
}

/**
 * Enter the app already seeded and authed.
 *
 * - `local` / `demo`: inject the mode; the provider seeds the DB and a synthetic
 *   session and the app lands straight on `/Dashboard`.
 * - `cloud`: inject the mode (persists it, no synthetic session) so the app
 *   routes to `/Login`, then perform the real login. Requires credentials.
 *
 * Pass no `mode` to use the current project's mode (see {@link projectMode}).
 */
export async function gotoApp(page: Page, mode: StorageMode = projectMode()): Promise<void> {
  if (mode === "cloud") {
    if (!hasCloudCreds) {
      throw new Error("Cloud credentials missing — set E2E_CLOUD_EMAIL / E2E_CLOUD_PASSWORD");
    }
    await page.goto(`/?storageMode=cloud`);
    await page.waitForURL(/\/Login/);
    await page.getByRole("textbox", { name: "Email" }).fill(cloudCredentials.email);
    await page.getByRole("textbox", { name: "Password" }).fill(cloudCredentials.password);
    await page.getByRole("button", { name: /login|sign in/i }).click();
    await page.waitForURL("**/Dashboard");
  } else {
    await page.goto(`/?storageMode=${mode}`);
    await page.waitForURL("**/Dashboard");
  }
  await awaitAppReady(page);
}

/**
 * Test fixture that enters the app in the current project's mode before the test
 * body runs, and skips cloud-project runs when no credentials are configured.
 * Each test gets its own `page` (and therefore its own context + local DB).
 */
export const test = base.extend<{ appMode: StorageMode }>({
  // `provide` is Playwright's fixture-value callback (conventionally `use`);
  // renamed here so eslint-react-hooks doesn't mistake it for the React `use` hook.
  appMode: async ({}, provide) => {
    const mode = projectMode();
    if (mode === "cloud") {
      test.skip(!hasCloudCreds, "Cloud credentials not configured (E2E_CLOUD_EMAIL/PASSWORD)");
    }
    await provide(mode);
  },
});

export { expect } from "@playwright/test";
