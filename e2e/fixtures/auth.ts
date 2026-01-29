import { test as base, Page } from "@playwright/test";
import { selectors } from "../utils/selectors";

export type StorageMode = "local" | "cloud";

export const cloudCredentials = {
    email: process.env.EXPO_PUBLIC_SUPABASE_TEST_EMAIL!,
    password: process.env.EXPO_PUBLIC_SUPABASE_TEST_PASSWORD!,
};

export async function loginWithMode(page: Page, mode: StorageMode): Promise<void> {
    await page.goto("/");
    await page.waitForSelector(selectors.landing.welcomeText);


    if (mode === "local") {
        await page.getByTestId(selectors.landing.localModeButton).click();
    } else if (mode === "cloud") {
        if (!cloudCredentials.email || !cloudCredentials.password) {
            throw new Error("Cloud credentials are not set");
        }

        await page.getByTestId(selectors.landing.cloudModeButton).click();
        await page.waitForURL("**/Login");
        await page.getByRole('textbox', { name: selectors.auth.emailInput }).fill(cloudCredentials.email);
        await page.getByRole('textbox', { name: selectors.auth.passwordInput }).fill(cloudCredentials.password);
        await page.getByRole("button", { name: selectors.auth.loginButton }).click();
    }

    await page.waitForURL("**/Dashboard", { timeout: 30000 });
}

export async function logout(page: Page): Promise<void> {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL("/");
}

// TODO: Remove this 
export const test = base.extend<{
    loginLocal: () => Promise<void>;
    loginCloud: () => Promise<void>;
}>({
    loginLocal: async ({ page }, use) => {
        await use(async () => {
            await loginWithMode(page, "local");
        });
    },
    loginCloud: async ({ page }, use) => {
        await use(async () => {
            await loginWithMode(page, "cloud");
        });
    },
});

export { expect } from "@playwright/test";

