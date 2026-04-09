import { expect, test } from "@playwright/test";

test.describe("Landing Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("displays welcome message and storage mode options", async ({ page }) => {
        // The landing page shows "Welcome back" for returning users or "Welcome to" for new users
        await expect(page.getByText(/Welcome (to|back)/)).toBeVisible();
        await expect(page.getByText("Budgeteer").first()).toBeVisible();
        await expect(page.getByTestId("mode-local")).toBeVisible();
        await expect(page.getByTestId("mode-cloud")).toBeVisible();
        await expect(page.getByTestId("mode-demo")).toBeVisible();
    });

    test("theme toggle button is visible", async ({ page }) => {
        const themeButton = page.getByLabel("Toggle theme");
        await expect(themeButton).toBeVisible();
    });

    test("clicking Demo Mode navigates to Dashboard", async ({ page }) => {
        await page.getByTestId("mode-demo").click();
        await page.waitForURL("**/Dashboard", { timeout: 30000 });
        await expect(page).toHaveURL(/Dashboard/);
    });

    test("clicking Local Mode navigates to Dashboard", async ({ page }) => {
        await page.getByTestId("mode-local").click();
        await page.waitForURL("**/Dashboard", { timeout: 30000 });
        await expect(page).toHaveURL(/Dashboard/);
    });

    test("clicking Cloud Mode navigates to Login page", async ({ page }) => {
        await page.getByTestId("mode-cloud").click();
        await page.waitForURL("**/Login", { timeout: 10000 });
        await expect(page).toHaveURL(/Login/);
    });
});
