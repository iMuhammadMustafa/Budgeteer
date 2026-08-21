import { expect } from "@playwright/test";

import { gotoApp, test } from "../fixtures/app";
import {
  createAccount,
  deleteSelectedTransactions,
  fillTransactionForm,
  getItemId,
  listItem,
  restoreItemById,
  selectTransaction,
  setSelectedVoid,
  transactionRow,
} from "../utils/forms";
import {
  navigateToAccounts,
  navigateToAddTransaction,
  navigateToRestoreTransactions,
  navigateToTransactions,
} from "../utils/helpers/navigation";

/**
 * Transaction create/edit/delete journeys against the redesigned keypad form
 * (`/AddTransaction`). Local mode seeds categories + groups but NO accounts
 * (only demo does), so each journey first creates an account, then asserts the
 * money movement via that account's balance on the Accounts screen — a robust,
 * unique check that also exercises the account↔transaction integration.
 *
 * Parity with the legacy `transactions.spec.ts` + the balance-affecting slice of
 * `account-transaction-integration.spec.ts`: create/edit/delete plus transfer,
 * account-change re-reconciliation, and void/unvoid restore.
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

  test("recording a transfer moves funds between two accounts", async ({ page }) => {
    const stamp = Date.now();
    const source = `Transfer From ${stamp}`;
    const target = `Transfer To ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: source, categoryName: "Cash", balance: "1000" });
    await createAccount(page, { name: target, categoryName: "Cash", balance: "0" });

    await navigateToAddTransaction(page);
    // Transfer auto-assigns the transfer category, so no categoryName is passed.
    await fillTransactionForm(page, {
      type: "Transfer",
      amount: "200",
      accountName: source,
      transferAccountName: target,
    });

    await navigateToAccounts(page);
    await expect(listItem(page, source)).toContainText("$800.00");
    await expect(listItem(page, target)).toContainText("$200.00");
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
    await transactionRow(page, txnName).first().click();
    await page.waitForURL(/\/AddTransaction/);
    await page.getByTestId("field-amount-input").fill("300");
    await page.getByTestId("btn-form-submit").click();
    await page.waitForURL(/\/Transactions/);

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$700.00");
  });

  test("changing a transaction's account moves the balance between accounts", async ({ page }) => {
    const stamp = Date.now();
    const from = `From Acct ${stamp}`;
    const to = `To Acct ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: from, categoryName: "Cash", balance: "1000" });
    await createAccount(page, { name: to, categoryName: "Cash", balance: "1000" });

    const txnName = `Movable Expense ${stamp}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: from,
      name: txnName,
    });

    // The $100 expense currently sits on `from`.
    await navigateToAccounts(page);
    await expect(listItem(page, from)).toContainText("$900.00");

    // Re-assign it to `to` by editing the account field.
    await navigateToTransactions(page);
    await transactionRow(page, txnName).first().click();
    await page.waitForURL(/\/AddTransaction/);
    await page.getByTestId("field-accountid").click();
    await page.locator('[data-testid^="field-accountid-option-"]').filter({ hasText: to }).first().click();
    await page.getByTestId("btn-form-submit").click();
    await page.waitForURL(/\/Transactions/);

    // The expense left `from` (restored to 1000) and now burdens `to` (900).
    await navigateToAccounts(page);
    await expect(listItem(page, from)).toContainText("$1,000.00");
    await expect(listItem(page, to)).toContainText("$900.00");
  });

  test("voiding then unvoiding a transaction restores and re-applies the balance", async ({ page }) => {
    const account = `Void Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const txnName = `Voidable Expense ${Date.now()}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: account,
      name: txnName,
    });

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");

    // Void → the expense's effect is reversed, balance back to 1000.
    await navigateToTransactions(page);
    await selectTransaction(page, txnName);
    await setSelectedVoid(page, true);
    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$1,000.00");

    // Unvoid → the expense is re-applied, balance back to 900.
    await navigateToTransactions(page);
    await selectTransaction(page, txnName);
    await setSelectedVoid(page, false);
    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");
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
    await selectTransaction(page, txnName);
    await deleteSelectedTransactions(page);

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$1,000.00");
  });

  test("restoring a deleted transaction re-applies the account balance", async ({ page }) => {
    const account = `Restore Txn Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const txnName = `Restorable Expense ${Date.now()}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: account,
      name: txnName,
    });
    await selectTransaction(page, txnName);
    await deleteSelectedTransactions(page);

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$1,000.00");

    await navigateToRestoreTransactions(page);
    await expect(listItem(page, txnName).filter({ visible: true })).toBeVisible();
    const id = await getItemId(page, txnName);
    await restoreItemById(page, id);

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");
    await navigateToTransactions(page);
    await expect(transactionRow(page, txnName)).toBeVisible();
  });
});
