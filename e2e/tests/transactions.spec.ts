import { gotoApp, test } from "../fixtures/app";
import { createAccount, fillTransactionForm, listItem } from "../utils/forms";
import { expect } from "@playwright/test";
import { navigateToAccounts, navigateToAddTransaction } from "../utils/helpers/navigation";

/**
 * Transaction create/edit/delete journeys against the redesigned keypad form
 * (`/AddTransaction`). Local mode seeds categories + groups but NO accounts
 * (only demo does), so each journey first creates an account, then asserts the
 * money movement via that account's balance on the Accounts screen — a robust,
 * unique check that also exercises the account↔transaction integration.
 */
test.describe("transactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("recording an expense reduces the account balance", async ({ page }) => {
    const account = `Txn Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    await navigateToAddTransaction(page);
    await fillTransactionForm(page, { type: "Expense", amount: "100", categoryName: "Fuel", accountName: account });

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");
  });

  test("recording income increases the account balance", async ({ page }) => {
    const account = `Income Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    await navigateToAddTransaction(page);
    await fillTransactionForm(page, { type: "Income", amount: "250", categoryName: "Salary", accountName: account });

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$1,250.00");
  });

  test("editing a transaction's amount re-reconciles the balance", async ({ page }) => {
    const account = `Edit Txn Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const txnName = `Editable Expense ${Date.now()}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: account,
      name: txnName,
    });
    await expect(page).toHaveURL(/\/Transactions/);

    // Open THIS transaction for editing (not the +$1000 opening entry, which
    // also sits at the top of the list) via its unique name.
    await page.getByTestId(/^transaction-item-/).filter({ hasText: txnName }).first().click();
    await page.waitForURL(/\/AddTransaction/);
    await page.getByTestId("field-amount-input").fill("300");
    await page.getByTestId("btn-form-submit").click();
    await page.waitForURL(/\/Transactions/);

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$700.00");
  });

  test("deleting a transaction restores the account balance", async ({ page }) => {
    const account = `Del Txn Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const txnName = `Deletable Expense ${Date.now()}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: account,
      name: txnName,
    });

    // Long-press THIS row (not the opening entry) to enter selection mode,
    // then batch-delete.
    const row = page.getByTestId(/^transaction-item-/).filter({ hasText: txnName }).first();
    await row.click({ delay: 700 });
    await page.getByTestId("btn-delete-selected").click();
    await expect(page.getByTestId("dialog")).toBeVisible();
    await page.getByTestId("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByTestId("dialog")).toBeHidden();

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$1,000.00");
  });
});
