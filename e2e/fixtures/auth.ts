import { test as base, Page } from "@playwright/test";
import { selectors } from "../utils/selectors";

export type StorageMode = "local" | "cloud";

export const cloudCredentials = {
  email: process.env.EXPO_PUBLIC_SUPABASE_TEST_EMAIL!,
  password: process.env.EXPO_PUBLIC_SUPABASE_TEST_PASSWORD!,
};

/**
 * Login with the specified storage mode.
 *
 * - Cloud: If storageState is loaded (from global-setup), the app may already
 *   be authenticated. We check if we land on Dashboard directly.
 * - Local: Always performs full login since SQLite/OPFS is per browser context.
 */
export async function loginWithMode(page: Page, mode: StorageMode): Promise<void> {
  await page.goto("/");

  // Check if already on Dashboard (storageState restored a session)
  try {
    await page.waitForURL("**/Dashboard", { timeout: 5000 });
    // Already logged in — storageState worked
    return;
  } catch {
    // Not on Dashboard yet — proceed with login flow
  }

  // Wait for the landing page to render
  await page.waitForSelector(selectors.landing.welcomeText, { timeout: 30000 });

  if (mode === "local") {
    await page.getByTestId(selectors.landing.localModeButton).click();
  } else if (mode === "cloud") {
    if (!cloudCredentials.email || !cloudCredentials.password) {
      throw new Error("Cloud credentials are not set in .env.test");
    }

    await page.getByTestId(selectors.landing.cloudModeButton).click();
    await page.waitForURL("**/Login");
    await page.getByRole("textbox", { name: selectors.auth.emailInput }).fill(cloudCredentials.email);
    await page.getByRole("textbox", { name: selectors.auth.passwordInput }).fill(cloudCredentials.password);
    await page.getByRole("button", { name: selectors.auth.loginButton }).click();
  }

  // Wait for Dashboard — generous timeout for local mode SQLite init + seeding
  await page.waitForURL("**/Dashboard", { timeout: 60000 });
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /logout/i }).click();
  await page.waitForURL("/");
}

// Playwright test fixture with login helpers
export const test = base.extend<{
  loginLocal: () => Promise<void>;
  loginCloud: () => Promise<void>;
}>({
  loginLocal: async ({ page }, fn) => {
    await fn(async () => {
      await loginWithMode(page, "local");
    });
  },
  loginCloud: async ({ page }, fn) => {
    await fn(async () => {
      await loginWithMode(page, "cloud");
    });
  },
});

export { expect } from "@playwright/test";
