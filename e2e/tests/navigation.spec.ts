import { gotoApp, test } from "../fixtures/app";
import { expect } from "@playwright/test";
import {
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToAddTransaction,
  navigateToDashboard,
  navigateToRestoreAccountCategories,
  navigateToRestoreAccounts,
  navigateToRestoreTransactionCategories,
  navigateToRestoreTransactionGroups,
  navigateToRestoreTransactions,
  navigateToSettings,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
  navigateToTransactions,
} from "../utils/helpers/navigation";

// NOTE: no browser-back journey here. Under the injection harness the app is
// entered via `?storageMode=` + a client-side redirect to /Dashboard, so the
// history stack isn't the real landing→app flow — `page.goBack()` walks into
// the pre-app blank entry. Back-navigation is a manual/mobile follow-up.

/**
 * Comprehensive route navigation, folding in the legacy navigation spec.
 * Exercises the persistent sidebar (top-level routes), the SecondaryTabBar
 * sub-tabs (Account Categories, Groups, Restore/*), and browser back — all via
 * URL assertions, no hard waits.
 */
test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("navigates to every top-level screen from the sidebar", async ({ page }) => {
    await navigateToTransactions(page);
    await expect(page).toHaveURL(/\/Transactions/);

    await navigateToAddTransaction(page);
    await expect(page).toHaveURL(/\/AddTransaction/);

    await navigateToAccounts(page);
    await expect(page).toHaveURL(/\/Accounts$/);

    await navigateToSettings(page);
    await expect(page).toHaveURL(/\/Settings/);

    await navigateToDashboard(page);
    await expect(page).toHaveURL(/\/Dashboard/);
  });

  test("navigates to sub-tab screens", async ({ page }) => {
    await navigateToAccountCategories(page);
    await expect(page).toHaveURL(/\/Accounts\/Categories/);

    await navigateToTransactionGroups(page);
    await expect(page).toHaveURL(/\/Categories\/Groups/);

    await navigateToRestoreAccounts(page);
    await expect(page).toHaveURL(/\/Restore\/Accounts/);

    await navigateToRestoreTransactionGroups(page);
    await expect(page).toHaveURL(/\/Restore\/TransactionGroups/);
  });

  test("navigates to every Restore sub-tab", async ({ page }) => {
    await navigateToRestoreAccounts(page);
    await expect(page).toHaveURL(/\/Restore\/Accounts/);

    await navigateToRestoreAccountCategories(page);
    await expect(page).toHaveURL(/\/Restore\/AccountCategories/);

    await navigateToRestoreTransactions(page);
    await expect(page).toHaveURL(/\/Restore\/Transactions/);

    await navigateToRestoreTransactionCategories(page);
    await expect(page).toHaveURL(/\/Restore\/TransactionCategories/);

    await navigateToRestoreTransactionGroups(page);
    await expect(page).toHaveURL(/\/Restore\/TransactionGroups/);
  });

  test("switches between the Categories and Groups sub-tabs", async ({ page }) => {
    await navigateToTransactionGroups(page);
    await expect(page).toHaveURL(/\/Categories\/Groups/);

    // Back to the Categories index (which IS Transaction Categories).
    await navigateToTransactionCategories(page);
    await expect(page).toHaveURL(/\/Categories$/);
  });
});
