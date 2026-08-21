import { expect } from "@playwright/test";

import { gotoApp, test } from "../fixtures/app";
import {
  createAccount,
  createRecurring,
  deleteItemById,
  getItemId,
  listItem,
  openEditFormById,
  restoreItemById,
  transactionRow,
} from "../utils/forms";
import {
  navigateToAccounts,
  navigateToRecurrings,
  navigateToRestoreRecurrings,
  navigateToTransactions,
} from "../utils/helpers/navigation";

test.describe("recurring transactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("creates, edits, deletes, and restores a recurring transaction", async ({ page }) => {
    const stamp = Date.now();
    const account = `Recurring Acct ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const original = `Monthly Bill ${stamp}`;
    await navigateToRecurrings(page);
    await createRecurring(page, { name: original, amount: "100", categoryName: "Fuel", accountName: account });
    const id = await getItemId(page, original);

    const updated = `Updated Bill ${stamp}`;
    await openEditFormById(page, id);
    await page.getByTestId("recurring-name").fill(updated);
    await page.getByTestId("btn-recurring-submit").click();
    await page.waitForURL(/\/Recurrings/);
    await expect(listItem(page, updated).filter({ visible: true })).toBeVisible();

    await deleteItemById(page, id);
    await expect(listItem(page, updated).filter({ visible: true })).toHaveCount(0);

    await navigateToRestoreRecurrings(page);
    await expect(listItem(page, updated).filter({ visible: true })).toBeVisible();
    await restoreItemById(page, id);
    await navigateToRecurrings(page);
    await expect(listItem(page, updated).filter({ visible: true })).toBeVisible();
  });

  test("executing a recurring expense creates a transaction and updates the account balance", async ({ page }) => {
    const stamp = Date.now();
    const account = `Execute Recurring ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const recurring = `Executed Bill ${stamp}`;
    await navigateToRecurrings(page);
    await createRecurring(page, { name: recurring, amount: "125", categoryName: "Fuel", accountName: account });
    const id = await getItemId(page, recurring);
    await page.getByTestId(`btn-execute-recurring-${id}`).click();

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$875.00");
    await navigateToTransactions(page);
    await expect(transactionRow(page, recurring)).toBeVisible();
  });
});
