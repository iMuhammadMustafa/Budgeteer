import { gotoApp, test } from "../fixtures/app";
import {
  createAccount,
  deleteItemReassigning,
  fillTransactionForm,
  getItemId,
  listItem,
  overlay,
  selectTransaction,
  setSelectedVoid,
  transactionRow,
} from "../utils/forms";
import { expect } from "@playwright/test";
import { navigateToAccounts, navigateToAddTransaction, navigateToTransactions } from "../utils/helpers/navigation";

/**
 * Account ↔ transaction money-movement invariants — the balance-critical slice
 * of the legacy `account-transaction-integration.spec.ts`, ported onto the
 * injection harness. The single-account create/edit/delete/void cases live in
 * `transactions.spec.ts`; this file covers the cross-entity cases: transfers
 * that touch two balances, balance adjustments (with/without an audit record),
 * the balance==running-balance invariant, and account deletion with dependent
 * transactions (cascade vs reassign).
 *
 * Note: out-of-order-date running-balance is intentionally not ported — it
 * requires driving the date picker to backdate entries, which the SQLite
 * integration suite (`repos.integration.test.ts`) already covers deterministically
 * via `getAccountBalanceAtDate`/running-balance without UI flakiness.
 */
test.describe("account ↔ transaction integration", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("updating a transfer's amount updates both account balances", async ({ page }) => {
    const stamp = Date.now();
    const source = `Xfer Src ${stamp}`;
    const target = `Xfer Dst ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: source, categoryName: "Cash", balance: "1000" });
    await createAccount(page, { name: target, categoryName: "Cash", balance: "0" });

    const txnName = `Editable Transfer ${stamp}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Transfer",
      amount: "200",
      accountName: source,
      transferAccountName: target,
      name: txnName,
    });

    await navigateToAccounts(page);
    await expect(listItem(page, source)).toContainText("$800.00");
    await expect(listItem(page, target)).toContainText("$200.00");

    // Bump the transfer to $350 — both sides re-reconcile.
    await navigateToTransactions(page);
    await transactionRow(page, txnName).first().click();
    await page.waitForURL(/\/AddTransaction/);
    await page.getByTestId("field-amount-input").fill("350");
    await page.getByTestId("btn-form-submit").click();
    await page.waitForURL(/\/Transactions/);

    await navigateToAccounts(page);
    await expect(listItem(page, source)).toContainText("$650.00");
    await expect(listItem(page, target)).toContainText("$350.00");
  });

  test("voiding a transfer restores the source but not the destination (KNOWN BUG)", async ({ page }) => {
    // KNOWN BUG (task_2001b6da): the batch-update void path in
    // Transactions.Service.ts (`useUpdateMultipleTransactions`) only reverses
    // `tx.accountid`, never `tx.transferaccountid`. So voiding a transfer
    // restores the SOURCE account but strands the money in the DESTINATION.
    // This test LOCKS the current (buggy) behavior — flip the destination
    // assertion to "$0.00" once the service reverses both legs.
    const stamp = Date.now();
    const source = `VoidXfer Src ${stamp}`;
    const target = `VoidXfer Dst ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: source, categoryName: "Cash", balance: "1000" });
    await createAccount(page, { name: target, categoryName: "Cash", balance: "0" });

    const txnName = `Voidable Transfer ${stamp}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Transfer",
      amount: "200",
      accountName: source,
      transferAccountName: target,
      name: txnName,
    });

    await navigateToAccounts(page);
    await expect(listItem(page, source)).toContainText("$800.00");
    await expect(listItem(page, target)).toContainText("$200.00");

    // Void the transfer.
    await navigateToTransactions(page);
    await selectTransaction(page, txnName);
    await setSelectedVoid(page, true);

    await navigateToAccounts(page);
    await expect(listItem(page, source)).toContainText("$1,000.00"); // source restored
    await expect(listItem(page, target)).toContainText("$200.00"); // BUG: destination NOT restored
  });

  test("adjusting balance with 'record' on writes a Balance Adjustment transaction", async ({ page }) => {
    const name = `Recorded Adjust ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name, categoryName: "Cash", balance: "200" });

    await listItem(page, name).click();
    await page.waitForURL(/\/Accounts\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: "Adjust balance" }).click();
    await expect(overlay(page)).toBeVisible();
    await page.getByTestId("adjust-balance-input").fill("300");
    // `adjust-record` defaults on; leave it. Save.
    await page.getByTestId("adjust-submit-btn").click();
    await expect(overlay(page)).toBeHidden();

    // A "Balance Adjustment" transaction now exists for the +$100 delta.
    await navigateToTransactions(page);
    await expect(transactionRow(page, "Balance Adjustment")).toBeVisible();

    // Balance reconciles — no danger mismatch on the list.
    await navigateToAccounts(page);
    await expect(listItem(page, name)).toContainText("$300.00");
  });

  test("adjusting balance with 'record' off leaves current and running balance divergent", async ({ page }) => {
    const name = `Silent Adjust ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name, categoryName: "Cash", balance: "200" });

    await listItem(page, name).click();
    await page.waitForURL(/\/Accounts\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: "Adjust balance" }).click();
    await expect(overlay(page)).toBeVisible();
    await page.getByTestId("adjust-balance-input").fill("300");
    // Turn OFF the audit record — stored balance moves but no transaction backs it.
    await page.getByTestId("adjust-record").click();
    await page.getByTestId("adjust-submit-btn").click();
    await expect(overlay(page)).toBeHidden();

    // No Balance Adjustment transaction was written — the stored balance moved
    // on its own, so current ($300) and running ($200) balance now diverge (the
    // detail page's current-balance mismatch styling; asserted at the data level
    // by the SQLite running-balance suite). The stored balance is the list value.
    await navigateToTransactions(page);
    await expect(transactionRow(page, "Balance Adjustment")).toHaveCount(0);

    await navigateToAccounts(page);
    await expect(listItem(page, name)).toContainText("$300.00");
  });

  test("deleting an account reassigns its transactions to another account", async ({ page }) => {
    const stamp = Date.now();
    const doomed = `Doomed Acct ${stamp}`;
    const heir = `Heir Acct ${stamp}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: doomed, categoryName: "Cash", balance: "500" });
    await createAccount(page, { name: heir, categoryName: "Cash", balance: "1000" });

    const movedTxn = `Movable ${stamp}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: doomed,
      name: movedTxn,
    });

    await navigateToAccounts(page);
    const doomedId = await getItemId(page, doomed);
    const heirId = await getItemId(page, heir);

    // Delete the account but move its transactions to `heir` rather than
    // cascade-deleting them.
    await deleteItemReassigning(page, doomedId, heirId);

    // The account is gone but its transaction survived (reassigned, not deleted).
    await expect(listItem(page, doomed).filter({ visible: true })).toHaveCount(0);
    await expect(listItem(page, heir)).toBeVisible();
    await navigateToTransactions(page);
    await expect(transactionRow(page, movedTxn)).toBeVisible();
  });
});
