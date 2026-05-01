import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  closeModal,
  createAccount,
  deleteItemById,
  fillAccountForm,
  fillCategoryForm,
  getAccountBalance,
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToRestoreAccounts,
  navigateToTransactionsViaDrawer,
  openMyTabAddModal,
  openMyTabEditModal,
  openMyTabRestoreModal,
  saveForm,
  verifyAccountBalance,
  verifyTransactionExists,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading = "Account";

for (const mode of storageModes) {
  // =====================================================================
  // CRUD + RESTORE
  // =====================================================================
  test.describe(`Accounts CRUD [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });
    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      testCategoryName = `Test Category for Accounts ${Date.now()}`;
      await navigateToAccountCategories(page);

      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: testCategoryName,
        type: "Asset",
        displayOrder: "9999",
      });
      await saveForm(page);
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      await expect(page.getByText(testCategoryName)).toBeVisible();
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      await navigateToAccounts(page);
    });

    test("can view accounts list", async () => {
      await expect(page.getByTestId(selectors.myTab.tab("Accounts"))).toBeVisible();
      await expect(page.getByText("Total Account Balance:")).toBeVisible();
    });

    test("can create a new account", async () => {
      const accountName = `Test Account ${Date.now()}`;
      const uniqueBalance = Math.floor(Math.random() * 900) + 100;
      const initialBalance = uniqueBalance.toString();
      const formattedBalance = `$${uniqueBalance.toFixed(2)}`;

      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: initialBalance,
      });
      await saveForm(page);

      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();

      const accountListItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(accountListItem).toBeVisible();
      await expect(accountListItem.getByText(formattedBalance)).toBeVisible();

      // Verify details by reopening
      const modal = await openMyTabEditModal(page, accountName);
      await expect(modal.getByRole("textbox", { name: "Account Name (required)" })).toHaveValue(accountName);
      await closeModal(page);

      // Verify initial adjustment transaction was created
      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      const hasInitialTransaction = await verifyTransactionExists(page, {
        accountName,
      });
      expect(hasInitialTransaction).toBe(true);
    });

    test("can create account with zero balance", async () => {
      const accountName = `Zero Balance Account ${Date.now()}`;

      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: "0",
      });
      await saveForm(page);

      const accountListItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(accountListItem).toBeVisible();
      await expect(accountListItem.getByText("$0.00")).toBeVisible();
    });

    test("can update an account name", async () => {
      const originalName = await createAccount(page, {
        name: `Update Test ${Date.now()}`,
        categoryName: testCategoryName,
      });
      const updatedName = `Updated ${Date.now()}`;

      const modal = await openMyTabEditModal(page, originalName);
      await modal.getByRole("textbox", { name: "Account Name (required)" }).fill(updatedName);
      await saveForm(page);

      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();

      const updatedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: updatedName });
      const originalAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: originalName });
      await expect(updatedAccountItem).toBeVisible();
      await expect(originalAccountItem).not.toBeVisible();
    });

    test("can change account category", async () => {
      await navigateToAccountCategories(page);

      const secondCategoryName = `Second Category ${Date.now()}`;
      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: secondCategoryName,
        type: "Asset",
        displayOrder: "9998",
      });
      await saveForm(page);
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      await expect(page.getByText(secondCategoryName)).toBeVisible();

      await navigateToAccounts(page);

      const accountName = await createAccount(page, {
        name: `Category Change Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      const modal = await openMyTabEditModal(page, accountName);

      await modal
        .getByRole("list", { name: /Basic Information/ })
        .getByTestId(selectors.forms.dropdownButton)
        .click();
      await page.waitForTimeout(200);

      const dropdownSearch = page.getByTestId(selectors.forms.dropdownSearch).last();
      if (await dropdownSearch.isVisible()) {
        await dropdownSearch.fill(secondCategoryName);
        await page.waitForTimeout(200);
      }

      await page.getByTestId(selectors.forms.dropdownOption(secondCategoryName)).click();
      await page.waitForTimeout(300);

      await saveForm(page);
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      const updatedCategoryAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(updatedCategoryAccountItem).toBeVisible();
    });

    test("can soft delete an account", async () => {
      test.setTimeout(60000);

      const accountName = await createAccount(page, {
        name: `Delete Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(listItem).toBeVisible();
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await deleteItemById(page, itemId);

      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      const deletedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(deletedAccountItem).not.toBeVisible();
    });

    test("can restore a soft-deleted account", async () => {
      test.setTimeout(60000);

      const accountName = await createAccount(page, {
        name: `Restore Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(listItem).toBeVisible();
      const testIdStr = await listItem.getAttribute("data-testid");
      const itemId = testIdStr?.replace("list-item-", "") || "";
      await deleteItemById(page, itemId);
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      const removedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(removedAccountItem).not.toBeVisible();

      await navigateToRestoreAccounts(page);
      await expect(page.getByText("Deleted Accounts")).toBeVisible();

      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(deletedItem).toBeVisible();

      await openMyTabRestoreModal(page, accountName);

      const restoreModal = page.locator(selectors.ui.modal);
      await restoreModal.waitFor();
      await restoreModal.getByRole("button", { name: /restore|confirm/i }).click();

      await navigateToAccounts(page);
      const restoredAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(restoredAccountItem).toBeVisible();
    });

    test("accounts are grouped by category", async () => {
      const timestamp = Date.now();

      const accountName = await createAccount(page, {
        name: `Grouped Account ${timestamp}`,
        categoryName: testCategoryName,
      });

      await page.getByTestId(selectors.myTab.refreshButton).filter({ visible: true }).click();
      await page.waitForTimeout(500);

      await expect(page.getByText(testCategoryName)).toBeVisible();
      const groupedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(groupedAccountItem).toBeVisible();
    });
  });

  // =====================================================================
  // BALANCE TESTS
  // =====================================================================
  test.describe(`Account Balance Tests [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      testCategoryName = `Balance Test Category ${Date.now()}`;
      await navigateToAccountCategories(page);
      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: testCategoryName,
        type: "Asset",
        displayOrder: "9999",
      });
      await saveForm(page);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      await navigateToAccounts(page);
    });

    test("new account shows correct initial balance", async () => {
      const accountName = `Initial Balance Test ${Date.now()}`;

      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: "2500",
      });
      await saveForm(page);

      const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(accountRow).toContainText("$2,500.00");
    });

    test("adjustment transaction toggle is visible for existing accounts", async () => {
      const accountName = await createAccount(page, {
        name: `Adjustment Toggle Test ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      const modal = await openMyTabEditModal(page, accountName);
      await expect(modal.getByText("Add Adjustment Transaction")).toBeVisible();

      await closeModal(page);
    });

    test("can update account balance without adjustment transaction", async () => {
      const accountName = await createAccount(page, {
        name: `Balance Update No Adj ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      const modal = await openMyTabEditModal(page, accountName);

      const adjustmentToggle = modal.getByLabel("Add Adjustment Transaction");
      if (await adjustmentToggle.isChecked()) {
        await adjustmentToggle.click();
      }

      const balanceInput = modal.getByRole("textbox", { name: "Balance (required)" });
      await balanceInput.fill("1500");

      await saveForm(page);

      await verifyAccountBalance(page, accountName, "$1,500.00");
    });

    test("can update account balance with adjustment transaction", async () => {
      const accountName = await createAccount(page, {
        name: `Balance Update With Adj ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      const modal = await openMyTabEditModal(page, accountName);

      const adjustmentToggle = modal.getByLabel("Add Adjustment Transaction");
      if (!(await adjustmentToggle.isChecked())) {
        await adjustmentToggle.click();
      }

      const balanceInput = modal.getByRole("textbox", { name: "Balance (required)" });
      await balanceInput.fill("1500");

      await saveForm(page);

      await verifyAccountBalance(page, accountName, "$1,500.00");

      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      const hasAdjustmentTransaction = await verifyTransactionExists(page, {
        accountName,
        type: "Adjustment",
      });
      expect(hasAdjustmentTransaction).toBe(true);
    });
  });

  // =====================================================================
  // TRANSFER TESTS
  // =====================================================================
  test.describe(`Account Transfer Tests [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      testCategoryName = `Transfer Test Category ${Date.now()}`;
      await navigateToAccountCategories(page);
      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: testCategoryName,
        type: "Asset",
        displayOrder: "9999",
      });
      await saveForm(page);
      await navigateToAccounts(page);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      await navigateToAccounts(page);
    });

    test("can open transfer modal from account", async () => {
      const accountName = await createAccount(page, {
        name: `Transfer Source ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "5000",
      });

      const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await accountRow.getByRole("button").last().click();

      const modal = page.locator(selectors.ui.modal);
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/transfer to/i)).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
    });

    test("can transfer between two accounts", async () => {
      const sourceAccountName = await createAccount(page, {
        name: `Transfer Source ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "5000",
      });

      const destAccountName = await createAccount(page, {
        name: `Transfer Destination ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      const sourceBalanceBefore = await getAccountBalance(page, sourceAccountName);
      const destBalanceBefore = await getAccountBalance(page, destAccountName);
      expect(sourceBalanceBefore).toBe(5000);
      expect(destBalanceBefore).toBe(1000);

      // Open transfer modal on destination account
      const destAccountRow = page.getByTestId(/^list-item-/).filter({ hasText: destAccountName });
      const destItemId = (await destAccountRow.getAttribute("data-testid"))?.replace("list-item-", "") ?? "";
      await page.getByTestId(selectors.accounts.transferButton(destItemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await expect(modal).toBeVisible();

      await page.getByTestId(selectors.accounts.transferAmountInput).fill("500");

      await modal.getByTestId(selectors.forms.dropdownButton).click();
      await page.waitForTimeout(300);

      const dropdownSearch = page.getByTestId(selectors.forms.dropdownSearch).last();
      if (await dropdownSearch.isVisible()) {
        await dropdownSearch.fill(sourceAccountName);
        await page.waitForTimeout(200);
      }
      await page.getByTestId(selectors.forms.dropdownOption(sourceAccountName)).click();

      await page.getByTestId(selectors.accounts.transferSubmitButton).click();
      await expect(modal).not.toBeVisible();

      await page.getByTestId(selectors.myTab.refreshButton).filter({ visible: true }).click();
      await page.waitForTimeout(500);

      await verifyAccountBalance(page, sourceAccountName, "$4,500.00");
      await verifyAccountBalance(page, destAccountName, "$1,500.00");

      // Verify transfer transactions exist
      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      const hasTransferTransaction = await verifyTransactionExists(page, {
        type: "Transfer",
      });
      expect(hasTransferTransaction).toBe(true);
    });
  });

  // =====================================================================
  // DEPENDENCY TESTS
  // =====================================================================
  test.describe(`Account with Dependencies Tests [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      testCategoryName = `Dependency Test Category ${Date.now()}`;
      await navigateToAccountCategories(page);

      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: testCategoryName,
        type: "Asset",
        displayOrder: "9999",
      });
      await saveForm(page);
      await navigateToAccounts(page);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      await navigateToAccounts(page);
    });

    test("deleting account with transactions shows dependency modal", async () => {
      const accountName = await createAccount(page, {
        name: `Account with Transactions ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      await page.waitForTimeout(500);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      await expect(modal.getByText(/transaction/i).first()).toBeVisible();

      await page.keyboard.press("Escape");
    });
  });
}
