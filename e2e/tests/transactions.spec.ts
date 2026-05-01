import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  createTransaction,
  deleteTransaction,
  fillAccountForm,
  fillAmount,
  fillCategoryForm,
  fillTransactionCategoryForm,
  fillTransactionGroupForm,
  fillTransactionName,
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToRestoreTransactions,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
  navigateToTransactionsViaDrawer,
  openMyTabAddModal,
  openMyTabRestoreModal,
  openTransactionEditModal,
  saveForm,
  selectFormDropdown,
  setTransactionVoidStatus,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];

async function expectTransactionVisible(page: Page, name: string) {
  await expect(
    page
      .getByRole("link")
      .filter({ has: page.getByText(name, { exact: true }) })
      .first(),
  ).toBeVisible();
}

async function saveTransactionAndWaitForPersistence(page: Page, name: string) {
  await page.getByRole("button", { name: /save transaction/i }).click();

  await Promise.any([page.waitForURL("**/Transactions", { timeout: 15000 }), expectTransactionVisible(page, name)]);

  await expectTransactionVisible(page, name);
}

async function createAccountCategoryPrerequisite(page: Page, name: string) {
  await navigateToAccountCategories(page);
  await openMyTabAddModal(page, "Account Category");
  await fillCategoryForm(page, { name, type: "Asset", displayOrder: "9999" });
  await saveForm(page);
  await expect(page.getByTestId(/^list-item-/).filter({ hasText: name })).toBeVisible();
}

async function createAccountPrerequisite(
  page: Page,
  options: { name: string; categoryName: string; balance: string },
) {
  await navigateToAccounts(page);
  await openMyTabAddModal(page, "Account");
  await fillAccountForm(page, options);
  await saveForm(page);
  await expect(page.getByTestId(/^list-item-/).filter({ hasText: options.name })).toBeVisible();
}

async function createTransactionGroupPrerequisite(
  page: Page,
  options: { name: string; type: "Income" | "Expense" | "Transfer"; displayOrder: string },
) {
  await navigateToTransactionGroups(page);
  await openMyTabAddModal(page, "Transaction Group");
  await fillTransactionGroupForm(page, options);
  await saveForm(page);
  await expect(page.getByTestId(/^list-item-/).filter({ hasText: options.name })).toBeVisible();
}

async function createTransactionCategoryPrerequisite(
  page: Page,
  options: { name: string; groupName: string; displayOrder: string },
) {
  await navigateToTransactionCategories(page);
  await openMyTabAddModal(page);
  await fillTransactionCategoryForm(page, {
    name: options.name,
    groupName: options.groupName,
    budgetAmount: "0",
    budgetFrequency: "Monthly",
    displayOrder: options.displayOrder,
  });
  await saveForm(page);
  await expect(page.getByTestId(/^list-item-/).filter({ hasText: options.name })).toBeVisible();
}

for (const mode of storageModes) {
  test.describe(`Transactions CRUD [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testAccountCategoryName: string;
    let primaryAccountName: string;
    let secondaryAccountName: string;
    let expenseGroupName: string;
    let incomeGroupName: string;
    let transferGroupName: string;
    let expenseCategoryName: string;
    let alternateExpenseCategoryName: string;
    let incomeCategoryName: string;
    let transferCategoryName: string;
    let baselineTransactionName: string;

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(180000);

      page = await browser.newPage();
      await loginWithMode(page, mode);

      const timestamp = Date.now();

      testAccountCategoryName = `E2E AccCat ${timestamp}`;
      primaryAccountName = `E2E Account ${timestamp}`;
      secondaryAccountName = `E2E Transfer Account ${timestamp}`;
      expenseGroupName = `E2E Expense Group ${timestamp}`;
      incomeGroupName = `E2E Income Group ${timestamp}`;
      transferGroupName = `E2E Transfer Group ${timestamp}`;
      expenseCategoryName = `E2E Expense Cat ${timestamp}`;
      alternateExpenseCategoryName = `E2E Expense Cat Alt ${timestamp}`;
      incomeCategoryName = `E2E Income Cat ${timestamp}`;
      transferCategoryName = `E2E Transfer Cat ${timestamp}`;

      await createAccountCategoryPrerequisite(page, testAccountCategoryName);

      await createAccountPrerequisite(page, {
        name: primaryAccountName,
        categoryName: testAccountCategoryName,
        balance: "5000",
      });

      await createAccountPrerequisite(page, {
        name: secondaryAccountName,
        categoryName: testAccountCategoryName,
        balance: "2500",
      });

      await createTransactionGroupPrerequisite(page, {
        name: expenseGroupName,
        type: "Expense",
        displayOrder: "9999",
      });
      await createTransactionGroupPrerequisite(page, {
        name: incomeGroupName,
        type: "Income",
        displayOrder: "9998",
      });
      await createTransactionGroupPrerequisite(page, {
        name: transferGroupName,
        type: "Transfer",
        displayOrder: "9997",
      });

      await createTransactionCategoryPrerequisite(page, {
        name: expenseCategoryName,
        groupName: expenseGroupName,
        displayOrder: "9999",
      });
      await createTransactionCategoryPrerequisite(page, {
        name: alternateExpenseCategoryName,
        groupName: expenseGroupName,
        displayOrder: "9998",
      });
      await createTransactionCategoryPrerequisite(page, {
        name: incomeCategoryName,
        groupName: incomeGroupName,
        displayOrder: "9997",
      });
      await createTransactionCategoryPrerequisite(page, {
        name: transferCategoryName,
        groupName: transferGroupName,
        displayOrder: "9996",
      });

      baselineTransactionName = `Baseline Txn ${timestamp}`;
      await createTransaction(page, {
        name: baselineTransactionName,
        amount: "10",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });

      await navigateToTransactionsViaDrawer(page);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      await navigateToTransactionsViaDrawer(page);
    });

    // ----- READ -----

    test("can view transactions list", async () => {
      await expect(page).toHaveURL(/\/Transactions/);
      await expectTransactionVisible(page, baselineTransactionName);
    });

    // ----- CREATE -----

    test("can create an expense transaction", async () => {
      const txnName = `Test Expense ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "50",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });

      await expectTransactionVisible(page, txnName);
    });

    test("can create an income transaction", async () => {
      const txnName = `Test Income ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "200",
        accountName: primaryAccountName,
        type: "Income",
        categoryName: incomeCategoryName,
      });

      await expectTransactionVisible(page, txnName);
    });

    test("can create a transfer transaction", async () => {
      const txnName = `Test Transfer ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "125",
        accountName: primaryAccountName,
        type: "Transfer",
        categoryName: transferCategoryName,
        transferAccountName: secondaryAccountName,
      });

      await expectTransactionVisible(page, txnName);
    });

    test("can create a refund transaction", async () => {
      const txnName = `Test Refund ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "75",
        accountName: primaryAccountName,
        type: "Refund",
        categoryName: expenseCategoryName,
      });

      await expectTransactionVisible(page, txnName);
    });

    // ----- UPDATE -----

    test("can update a transaction name and amount", async () => {
      const originalName = `Update Txn ${Date.now()}`;
      const updatedName = `Updated Txn ${Date.now()}`;

      await createTransaction(page, {
        name: originalName,
        amount: "45",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });

      const editPage = await openTransactionEditModal(page, originalName);
      await fillTransactionName(editPage, updatedName);
      await fillAmount(editPage, "125");
      await saveTransactionAndWaitForPersistence(page, updatedName);

      await expectTransactionVisible(page, updatedName);

      // Verify values persisted
      const reopenedPage = await openTransactionEditModal(page, updatedName);
      await expect(reopenedPage.getByPlaceholder("Type to search..")).toHaveValue(updatedName);
      await expect(reopenedPage.getByRole("textbox", { name: /Amount/i })).toHaveValue("125");
    });

    test("can update a transaction category and account", async () => {
      const txnName = `Move Txn ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "60",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });

      await openTransactionEditModal(page, txnName);
      await selectFormDropdown(page, "Category", alternateExpenseCategoryName);
      await selectFormDropdown(page, "Account", secondaryAccountName);
      await saveTransactionAndWaitForPersistence(page, txnName);

      const updatedTransactionRow = page
        .getByRole("link")
        .filter({ has: page.getByText(txnName, { exact: true }) })
        .first();

      await expect(updatedTransactionRow).toContainText(alternateExpenseCategoryName);
      await expect(updatedTransactionRow).toContainText(secondaryAccountName);
    });

    // ----- VOID / UNVOID -----

    test("can void a transaction", async () => {
      const txnName = `Void Txn ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "30",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });
      await expectTransactionVisible(page, txnName);

      await setTransactionVoidStatus(page, txnName, true);

      // Transaction should still be visible (voided, not deleted)
      await expectTransactionVisible(page, txnName);
    });

    test("can unvoid a transaction", async () => {
      const txnName = `Unvoid Txn ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "40",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });

      // Void then unvoid
      await setTransactionVoidStatus(page, txnName, true);
      await setTransactionVoidStatus(page, txnName, false);

      await expectTransactionVisible(page, txnName);
    });

    // ----- DELETE -----

    test("can soft delete a transaction", async () => {
      const txnName = `Delete Txn ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "25",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });
      await expectTransactionVisible(page, txnName);

      await deleteTransaction(page, txnName);

      await expect(page.getByText(txnName)).not.toBeVisible();
    });

    // ----- RESTORE -----

    test("can restore a soft-deleted transaction", async () => {
      const txnName = `Restore Txn ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "30",
        accountName: primaryAccountName,
        type: "Expense",
        categoryName: expenseCategoryName,
      });
      await expectTransactionVisible(page, txnName);

      await deleteTransaction(page, txnName);
      await expect(page.getByText(txnName)).not.toBeVisible();

      await navigateToRestoreTransactions(page);
      await expect(page.getByText("Deleted Transactions")).toBeVisible();

      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: txnName });
      await expect(deletedItem).toBeVisible();

      await openMyTabRestoreModal(page, txnName);

      const restoreModal = page.locator(selectors.ui.modal);
      await restoreModal.waitFor({ state: "visible" });
      await restoreModal.getByRole("button", { name: /restore|confirm/i }).click();
      await expect(restoreModal).not.toBeVisible();

      await navigateToTransactionsViaDrawer(page);
      await expectTransactionVisible(page, txnName);
    });
  });
}
