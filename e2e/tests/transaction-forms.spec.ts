import { expect } from "@playwright/test";

import { gotoApp, test } from "../fixtures/app";
import { createAccount, fillTransactionForm, listItem, transactionRow } from "../utils/forms";
import { navigateToAccounts, navigateToAddTransaction } from "../utils/helpers/navigation";

/**
 * @smoke — focused create journeys for both transaction entry modes.
 *
 * These deliberately assert the persisted rows and the account balance, rather
 * than stopping at a successful navigation, so they cover the complete form →
 * repository → balance-reconciliation path.
 */
test.describe("@smoke transaction forms", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("single transaction form records an expense", async ({ page }) => {
    const stamp = Date.now();
    const account = `Single Form Account ${stamp}`;
    const transaction = `Single Form Expense ${stamp}`;

    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    await navigateToAddTransaction(page);
    await fillTransactionForm(page, {
      type: "Expense",
      amount: "125.50",
      categoryName: "Fuel",
      accountName: account,
      name: transaction,
    });

    await expect(transactionRow(page, transaction)).toBeVisible();
    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$874.50");
  });

  test("multiple transactions form records a balanced expense group", async ({ page }) => {
    const stamp = Date.now();
    const account = `Multiple Form Account ${stamp}`;
    const firstTransaction = `Multiple Fuel ${stamp}`;
    const secondTransaction = `Multiple Groceries ${stamp}`;

    await navigateToAccounts(page);
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });

    await navigateToAddTransaction(page);
    await page.getByTestId("tab-Multiple").click();
    await expect(page.getByTestId("multi-total-amount")).toBeVisible();

    await page.getByTestId("multi-total-amount-input").fill("100");
    await page.getByTestId("field-accountid").click();
    await page.locator('[data-testid^="field-accountid-option-"]').filter({ hasText: account }).first().click();

    const firstRow = page.getByTestId(/^multi-row-[0-9a-f-]+$/).first();
    await expect(firstRow).toHaveAttribute("data-testid", /^multi-row-[0-9a-f-]+$/);
    const firstRowId = (await firstRow.getAttribute("data-testid"))!;

    await page.getByTestId(`${firstRowId}-amount`).fill("60");
    await page.getByTestId(`${firstRowId}-name`).fill(firstTransaction);
    await page.getByTestId(`${firstRowId}-category`).click();
    await page
      .locator(`[data-testid^="${firstRowId}-category-option-"]`)
      .filter({ hasText: "Fuel" })
      .first()
      .click();

    await expect(page.getByText("⚠ Transactions need to be balanced")).toBeVisible();
    await expect(page.getByTestId("multi-submit")).toBeDisabled();

    await page.getByTestId("btn-add-transaction").click();
    const secondRow = page.getByTestId(/^multi-row-[0-9a-f-]+$/).nth(1);
    await expect(secondRow).toHaveAttribute("data-testid", /^multi-row-[0-9a-f-]+$/);
    const secondRowId = (await secondRow.getAttribute("data-testid"))!;

    // New rows inherit both the remaining amount and the previous category.
    await expect(page.getByTestId(`${secondRowId}-amount`)).toHaveValue("40");
    await expect(page.getByTestId(`${secondRowId}-category`)).toContainText("Fuel");
    await page.getByTestId(`${secondRowId}-name`).fill(secondTransaction);

    await expect(page.getByText("✓ Transactions are balanced")).toBeVisible();
    await expect(page.getByTestId("multi-submit")).toBeEnabled();
    await page.getByTestId("multi-submit").click();
    await page.waitForURL(/\/Transactions/);

    await expect(transactionRow(page, firstTransaction)).toBeVisible();
    await expect(transactionRow(page, secondTransaction)).toBeVisible();
    await navigateToAccounts(page);
    await expect(listItem(page, account)).toContainText("$900.00");
  });
});
