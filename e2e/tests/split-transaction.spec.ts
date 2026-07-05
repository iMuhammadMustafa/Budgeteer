import { gotoApp, test } from "../fixtures/app";
import { createAccount, fillTransactionForm, listItem } from "../utils/forms";
import { expect } from "@playwright/test";
import { navigateToAccounts, navigateToAddTransaction, navigateToTransactions } from "../utils/helpers/navigation";

/**
 * Split-transaction journey, replacing the legacy 22-hard-wait spec with
 * web-first assertions only.
 *
 * Splitting a single non-void, non-transfer transaction is reached by
 * long-pressing its row (selection mode) and tapping `btn-split-transaction`.
 * The modal seeds two children ("… (Part 1)" full amount + "… (Part 2)" zero);
 * children inherit the source account + category, so a balanced split only
 * needs the amounts. The children replace the original, so the account balance
 * is conserved.
 */
test.describe("split transaction", () => {
  test("splits a transaction into two balanced children", async ({ page }) => {
    await gotoApp(page);

    const account = `Split Acct ${Date.now()}`;
    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    const txnName = `Splittable ${Date.now()}`;
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "100",
      categoryName: "Fuel",
      accountName: account,
      name: txnName,
    });

    // Balance after the $100 expense.
    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");

    // Select the expense and open the split modal.
    await navigateToTransactions(page);
    const row = page.getByTestId(/^transaction-item-/).filter({ hasText: txnName }).first();
    await row.click({ delay: 700 });
    await page.getByTestId("btn-split-transaction").click();
    await expect(page.getByTestId("dialog")).toBeVisible();

    // Re-balance 100 → 60 + 40 across the two seeded children.
    await page.getByTestId("input-split-amount-0").fill("60");
    await page.getByTestId("input-split-amount-1").fill("40");
    await expect(page.getByText("✓ Balanced")).toBeVisible();

    await page.getByRole("button", { name: "Apply Split", exact: true }).click();
    await expect(page.getByTestId("dialog")).toBeHidden();

    // Two child rows now exist and the account balance is conserved.
    await expect(page.getByTestId(/^transaction-item-/).filter({ hasText: "(Part 1)" })).toBeVisible();
    await expect(page.getByTestId(/^transaction-item-/).filter({ hasText: "(Part 2)" })).toBeVisible();

    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");
  });
});
