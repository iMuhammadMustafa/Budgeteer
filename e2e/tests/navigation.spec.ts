import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
    navigateToAccountCategories,
    navigateToAccounts,
    navigateToRestoreAccountCategories,
    navigateToRestoreAccounts,
    navigateToRestoreTransactionCategories,
    navigateToRestoreTransactionGroups,
    navigateToRestoreTransactions,
    navigateToSettings,
    navigateToTransactionCategories,
    navigateToTransactionGroups,
    navigateToTransactions
} from "../utils/helpers";

const storageModes: StorageMode[] = ["local", "cloud"];

for (const mode of storageModes) {
    test.describe(`Navigation [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });
        
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await loginWithMode(page, mode);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.beforeEach(async () => {
            await page.goto("/Dashboard");
            await page.waitForLoadState("domcontentloaded");
        });

        test("Dashboard page loads after login", async () => {
            // After initial login, we should be on dashboard
            await expect(page).toHaveURL(/Dashboard/);
        });

        test("can navigate to Transactions page", async () => {
            await navigateToTransactions(page);
            await expect(page).toHaveURL(/Transactions/);
        });

        test("can navigate to Accounts page via drawer", async () => {
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);
        });

        test("can navigate to Account Categories page via drawer", async () => {
            await navigateToAccountCategories(page);
            await expect(page).toHaveURL(/Categories/);
        });

        test("can navigate to Transaction Categories page via drawer", async () => {
            await navigateToTransactionCategories(page);
            await expect(page).toHaveURL(/Categories/);
        });

        test("can navigate to Transaction Groups page via drawer", async () => {
            await navigateToTransactionGroups(page);
            await expect(page).toHaveURL(/Categories\/Groups/);
        });

        test("can navigate to Settings page via drawer", async () => {
            await navigateToSettings(page);
            await expect(page).toHaveURL(/Settings/);
        });

        test("browser back navigation works", async () => {
            // Ensure we are on home first before navigating and going back
            await page.goto("/Dashboard");
            // Navigate to Accounts using helper
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);

            // Go back to Dashboard
            await page.goBack();
            await expect(page).toHaveURL(/Dashboard/);
        });

        test("can navigate to Restore Accounts page", async () => {
            await navigateToRestoreAccounts(page);
            await expect(page).toHaveURL(/Restore\/Accounts/);
            await expect(page.getByText("Deleted Accounts")).toBeVisible({ timeout: 15000 });
        });

        test("can navigate to Restore Account Categories page", async () => {
            await navigateToRestoreAccountCategories(page);
            await expect(page).toHaveURL(/Restore\/AccountCategories/);
            await expect(page.getByText("Deleted Account Categories")).toBeVisible({ timeout: 15000 });
        });

        test("can navigate to Restore Transactions page", async () => {
            await navigateToRestoreTransactions(page);
            await expect(page).toHaveURL(/Restore\/Transactions/);
            await expect(page.getByText("Deleted Transactions")).toBeVisible({ timeout: 15000 });
        });

        test("can navigate to Restore Transaction Categories page", async () => {
            await navigateToRestoreTransactionCategories(page);
            await expect(page).toHaveURL(/Restore\/TransactionCategories/);
            await expect(page.getByText("Deleted Transaction Categories")).toBeVisible({ timeout: 15000 });
        });

        test("can navigate to Restore Transaction Groups page", async () => {
            await navigateToRestoreTransactionGroups(page);
            await expect(page).toHaveURL(/Restore\/TransactionGroups/);
            await expect(page.getByText("Deleted Transaction Groups")).toBeVisible({ timeout: 15000 });
        });

        test("can switch between Categories and Groups tabs", async () => {
            await navigateToTransactionCategories(page);
            await expect(page).toHaveURL(/Categories/);

            await page.locator('button[aria-label="Groups"]').click();
            await expect(page).toHaveURL(/Categories\/Groups/);

            await page.locator('button[aria-label="Categories"]').click();
            await expect(page).toHaveURL(/Categories/);
            await expect(page).not.toHaveURL(/Groups/);
        });

        test("can switch between Accounts and Categories tabs", async () => {
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);

            await page.locator('button[aria-label="Categories"]').click();
            await expect(page).toHaveURL(/Categories/);

            await page.locator('button[aria-label="Accounts"]').click();
            await expect(page).toHaveURL(/Accounts/);
        });
    });
}
