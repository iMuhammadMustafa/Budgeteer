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
        test.beforeEach(async ({ page }) => {
            await loginWithMode(page, mode);
        });

        test("Dashboard page loads after login", async ({ page }) => {
            await expect(page).toHaveURL(/Dashboard/);
        });

        test("can navigate to Transactions page", async ({ page }) => {
            await navigateToTransactions(page);
            await expect(page).toHaveURL(/Transactions/);
        });

        test("can navigate to Accounts page via drawer", async ({ page }) => {
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);
        });

        test("can navigate to Account Categories page via drawer", async ({ page }) => {
            await navigateToAccountCategories(page);
            await expect(page).toHaveURL(/Categories/);
        });

        test("can navigate to Transaction Categories page via drawer", async ({ page }) => {
            await navigateToTransactionCategories(page);
            await expect(page).toHaveURL(/Categories/);
        });

        test("can navigate to Transaction Groups page via drawer", async ({ page }) => {
            await navigateToTransactionGroups(page);
            await expect(page).toHaveURL(/Categories\/Groups/);
        });

        test("can navigate to Settings page via drawer", async ({ page }) => {
            await navigateToSettings(page);
            await expect(page).toHaveURL(/Settings/);
        });

        test("browser back navigation works", async ({ page }) => {
            // Navigate to Accounts using helper
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);

            // Go back to Dashboard
            await page.goBack();
            await expect(page).toHaveURL(/Dashboard/);
        });

        test("can navigate to Restore Accounts page", async ({ page }) => {
            await navigateToRestoreAccounts(page);
            await expect(page).toHaveURL(/Restore\/Accounts/);
            await expect(page.getByText("Deleted Accounts")).toBeVisible();
        });

        test("can navigate to Restore Account Categories page", async ({ page }) => {
            await navigateToRestoreAccountCategories(page);
            await expect(page).toHaveURL(/Restore\/AccountCategories/);
            await expect(page.getByText("Deleted Account Categories")).toBeVisible();
        });

        test("can navigate to Restore Transactions page", async ({ page }) => {
            await navigateToRestoreTransactions(page);
            await expect(page).toHaveURL(/Restore\/Transactions/);
            await expect(page.getByText("Deleted Transactions")).toBeVisible();
        });

        test("can navigate to Restore Transaction Categories page", async ({ page }) => {
            await navigateToRestoreTransactionCategories(page);
            await expect(page).toHaveURL(/Restore\/TransactionCategories/);
            await expect(page.getByText("Deleted Transaction Categories")).toBeVisible();
        });

        test("can navigate to Restore Transaction Groups page", async ({ page }) => {
            await navigateToRestoreTransactionGroups(page);
            await expect(page).toHaveURL(/Restore\/TransactionGroups/);
            await expect(page.getByText("Deleted Transaction Groups")).toBeVisible();
        });

        test("can switch between Categories and Groups tabs", async ({ page }) => {
            // Navigate to Transaction Categories first
            await navigateToTransactionCategories(page);
            await expect(page).toHaveURL(/Categories/);

            // Click on Groups tab (use aria-label to target the tab, not drawer button)
            await page.locator('button[aria-label="Groups"]').click();
            await expect(page).toHaveURL(/Categories\/Groups/);

            // Click back to Categories tab
            await page.locator('button[aria-label="Categories"]').click();

            await expect(page).toHaveURL(/Categories/);
            await expect(page).not.toHaveURL(/Groups/);
        });

        test("can switch between Accounts and Categories tabs", async ({ page }) => {
            // Navigate to Accounts first
            await navigateToAccounts(page);
            await expect(page).toHaveURL(/Accounts/);

            // Click on Categories tab (use aria-label to target the tab, not drawer button)
            await page.locator('button[aria-label="Categories"]').click();
            await expect(page).toHaveURL(/Categories/);

            // Click back to Accounts tab
            await page.locator('button[aria-label="Accounts"]').click();
            await expect(page).toHaveURL(/Accounts/);
        });
    });
}
