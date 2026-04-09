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
const heading: string = "Account";

for (const mode of storageModes) {
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
      // Use a unique balance to avoid matching other accounts
      const uniqueBalance = Math.floor(Math.random() * 900) + 100; // Random 100-999
      const initialBalance = uniqueBalance.toString();
      const formattedBalance = `$${uniqueBalance.toFixed(2)}`;

      // Create account
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: initialBalance,
      });
      await saveForm(page);

      // Verify Modal is closed by checking the modal element is no longer visible
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();

      // Verify account appears in list with correct balance
      const accountListItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(accountListItem).toBeVisible();
      await expect(accountListItem.getByText(formattedBalance)).toBeVisible();

      // Verify details by reopening
      const modal = await openMyTabEditModal(page, accountName);
      await expect(modal.getByRole("textbox", { name: "Account Name (required)" })).toHaveValue(accountName);
      await closeModal(page);

      // Navigate to Transactions and verify initial adjustment transaction was created
      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      // Verify an adjustment transaction exists for this account with the initial balance
      const hasInitialTransaction = await verifyTransactionExists(page, {
        accountName: accountName,
      });
      expect(hasInitialTransaction).toBe(true);
    });

    test("can update an account", async () => {
      const originalName = await createAccount(page, {
        name: `Update Test ${Date.now()}`,
        categoryName: testCategoryName,
      });
      const updatedName = `Updated ${Date.now()}`;

      // Open edit modal
      const modal = await openMyTabEditModal(page, originalName);

      // Update name
      await modal.getByRole("textbox", { name: "Account Name (required)" }).fill(updatedName);
      await saveForm(page);

      // Verify modal is closed
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();

      // Verify updated
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

      // Navigate back to accounts
      await navigateToAccounts(page);

      // Create an account with first category
      const accountName = await createAccount(page, {
        name: `Category Change Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      // Edit and change category
      const modal = await openMyTabEditModal(page, accountName);

      // Click on the category dropdown
      await modal
        .getByRole("list", { name: /Basic Information/ })
        .getByTestId(selectors.forms.dropdownButton)
        .click();

      // Wait for dropdown to open
      await page.waitForTimeout(200);

      // Search to filter down to the specific category (handles large lists)
      const dropdownSearch = page.getByTestId(selectors.forms.dropdownSearch).last();
      if (await dropdownSearch.isVisible()) {
        await dropdownSearch.fill(secondCategoryName);
        await page.waitForTimeout(200);
      }

      // Click the option by testID
      await page.getByTestId(selectors.forms.dropdownOption(secondCategoryName)).click();
      await page.waitForTimeout(300);

      await saveForm(page);
      // Wait for the modal to close after saving
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // Verify account is still visible (under new category)
      const updatedCategoryAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(updatedCategoryAccountItem).toBeVisible();
    });

    test("can soft delete an account", async () => {
      test.setTimeout(60000); // Extend timeout for slower operations

      const accountName = await createAccount(page, {
        name: `Delete Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      // Find the item's ID in the list and delete
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(listItem).toBeVisible();
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await deleteItemById(page, itemId);

      // Verify modal is closed and item removed from list
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      const deletedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(deletedAccountItem).not.toBeVisible();
    });

    test("can restore a soft-deleted account", async () => {
      test.setTimeout(60000); // Extend timeout for slower operations

      // First create an account on the main page
      const accountName = await createAccount(page, {
        name: `Restore Test ${Date.now()}`,
        categoryName: testCategoryName,
      });

      // Get item ID and delete it
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(listItem).toBeVisible();
      const testIdStr = await listItem.getAttribute("data-testid");
      const itemId = testIdStr?.replace("list-item-", "") || "";
      await deleteItemById(page, itemId);
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
      const removedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(removedAccountItem).not.toBeVisible();

      // Navigate to Restore page
      await navigateToRestoreAccounts(page);
      await expect(page.getByText("Deleted Accounts")).toBeVisible();

      // Find the deleted item and click restore button
      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(deletedItem).toBeVisible();

      // Click the restore action button
      await openMyTabRestoreModal(page, accountName);

      // Confirm restore in modal
      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor();
      await modal.getByRole("button", { name: /restore|confirm/i }).click();

      // Verify restored - navigate back to accounts
      await navigateToAccounts(page);
      const restoredAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(restoredAccountItem).toBeVisible();
    });

    test("accounts are grouped by category", async () => {
      const timestamp = Date.now();

      // Create an account
      const accountName = await createAccount(page, {
        name: `Grouped Account ${timestamp}`,
        categoryName: testCategoryName,
      });

      // Refresh to ensure grouping is applied
      await page.getByTestId(selectors.myTab.refreshButton).filter({ visible: true }).click();
      await page.waitForTimeout(500);

      // Verify the account appears under the category group
      await expect(page.getByText(testCategoryName)).toBeVisible();
      const groupedAccountItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(groupedAccountItem).toBeVisible();
    });
  });

  test.describe(`Account Balance Tests [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      testCategoryName = `Test Category ${Date.now()}`;
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
      const initialBalance = "2500";

      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: initialBalance,
      });
      await saveForm(page);

      // Verify the balance appears correctly formatted
      const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await expect(accountRow).toContainText("$2,500.00");
    });

    test("total balance updates when account is created", async () => {
      // Get initial total balance
      const totalBalanceText = page.getByText("Total Account Balance:").locator("..");
      await expect(totalBalanceText).toBeVisible();
      const initialTotalBalance = Number(await totalBalanceText.textContent());

      // Create a new account with known balance
      const accountName = `Total Balance Test ${Date.now()}`;
      await createAccount(page, {
        name: accountName,
        categoryName: testCategoryName,
        balance: "1000",
      });

      // Refresh to ensure total is updated
      await page.getByTestId(selectors.myTab.refreshButton).first().click();
      await page.waitForTimeout(500);

      // Verify total balance section is still visible
      await expect(page.getByText("Total Account Balance:")).toBeVisible();
      const updatedTotalBalance = Number(await totalBalanceText.textContent());
      expect(updatedTotalBalance).toBe(initialTotalBalance + 1000);
    });

    test("adjustment transaction toggle is visible for existing accounts", async () => {
      const accountName = await createAccount(page, {
        name: `Adjustment Toggle Test ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      // Open edit modal for existing account
      const modal = await openMyTabEditModal(page, accountName);

      // Verify the adjustment transaction toggle is visible
      await expect(modal.getByText("Add Adjustment Transaction")).toBeVisible();

      await closeModal(page);
    });

    test("can update account balance without adjustment transaction", async () => {
      const accountName = await createAccount(page, {
        name: `Balance Update No Adj ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      // Edit account and update balance
      const modal = await openMyTabEditModal(page, accountName);

      // Ensure adjustment toggle is OFF (unchecked)
      const adjustmentToggle = modal.getByLabel("Add Adjustment Transaction");
      if (await adjustmentToggle.isChecked()) {
        await adjustmentToggle.click();
      }

      // Update balance field
      const balanceInput = modal.getByRole("textbox", { name: "Balance (required)" });
      await balanceInput.fill("1500");

      await saveForm(page);

      // Verify updated balance
      await verifyAccountBalance(page, accountName, "$1,500.00");

      const hasAdjustmentTransaction = await verifyTransactionExists(page, {
        accountName: accountName,
        type: "Adjustment",
      });
      expect(hasAdjustmentTransaction).toBe(false);
    });

    test("can update account balance with adjustment transaction", async () => {
      const accountName = await createAccount(page, {
        name: `Balance Update With Adj ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000",
      });

      // Edit account and update balance
      const modal = await openMyTabEditModal(page, accountName);

      // Ensure adjustment toggle is ON (checked)
      const adjustmentToggle = modal.getByLabel("Add Adjustment Transaction");
      if (!(await adjustmentToggle.isChecked())) {
        await adjustmentToggle.click();
      }

      // Update balance field (increase by $500)
      const balanceInput = modal.getByRole("textbox", { name: "Balance (required)" });
      await balanceInput.fill("1500");

      await saveForm(page);

      // Verify updated balance
      await verifyAccountBalance(page, accountName, "$1,500.00");

      // Navigate to Transactions and verify adjustment transaction was created
      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      // Verify an adjustment transaction exists for this account
      const hasAdjustmentTransaction = await verifyTransactionExists(page, {
        accountName: accountName,
        type: "Adjustment",
      });
      expect(hasAdjustmentTransaction).toBe(true);
    });
  });

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

      // Find the account row and click the transfer button (last button in row)
      const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      await accountRow.getByRole("button").last().click();

      // Verify transfer modal opens
      const modal = page.locator(selectors.ui.modal);
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/transfer to/i)).toBeVisible();

      // Close modal
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
    });

    test("can transfer between two accounts", async () => {
      // Create source and destination accounts
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

      // Record balances before transfer
      const sourceBalanceBefore = await getAccountBalance(page, sourceAccountName);
      const destBalanceBefore = await getAccountBalance(page, destAccountName);
      expect(sourceBalanceBefore).toBe(5000);
      expect(destBalanceBefore).toBe(1000);

      // Open transfer modal on destination account via transfer button testID
      const destAccountRow = page.getByTestId(/^list-item-/).filter({ hasText: destAccountName });
      const destItemId = (await destAccountRow.getAttribute("data-testid"))?.replace("list-item-", "") ?? "";
      await page.getByTestId(selectors.accounts.transferButton(destItemId)).click();

      // Wait for modal
      const modal = page.locator(selectors.ui.modal);
      await expect(modal).toBeVisible();

      // Fill transfer amount
      await page.getByTestId(selectors.accounts.transferAmountInput).fill("500");

      // Select source account via dropdown
      await modal.getByTestId(selectors.forms.dropdownButton).click();
      await page.waitForTimeout(300);

      // Search and select source account by testID option
      const dropdownSearch = page.getByTestId(selectors.forms.dropdownSearch).last();
      if (await dropdownSearch.isVisible()) {
        await dropdownSearch.fill(sourceAccountName);
        await page.waitForTimeout(200);
      }
      await page.getByTestId(selectors.forms.dropdownOption(sourceAccountName)).click();

      // Submit transfer
      await page.getByTestId(selectors.accounts.transferSubmitButton).click();

      // Wait for modal to close
      await expect(modal).not.toBeVisible();

      // Refresh to see updated balances
      await page.getByTestId(selectors.myTab.refreshButton).filter({ visible: true }).click();
      await page.waitForTimeout(500);

      // Verify balance changes (source -500, dest +500)
      await verifyAccountBalance(page, sourceAccountName, "$4,500.00");
      await verifyAccountBalance(page, destAccountName, "$1,500.00");

      // Navigate to Transactions and verify transfer transactions exist
      await navigateToTransactionsViaDrawer(page);
      await page.waitForTimeout(500);

      // Verify transfer transactions are visible (one for each account leg)
      const hasTransferTransaction = await verifyTransactionExists(page, {
        type: "Transfer",
      });
      expect(hasTransferTransaction).toBe(true);
    });
  });

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
      // Create an account WITH an initial balance
      // This automatically creates an adjustment transaction, which means the account has dependencies
      const accountName = await createAccount(page, {
        name: `Account with Transactions ${Date.now()}`,
        categoryName: testCategoryName,
        balance: "1000", // Non-zero balance creates an adjustment transaction
      });

      // Wait a moment for the adjustment transaction to be created
      await page.waitForTimeout(500);

      // Try to delete the account
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      // Click delete button
      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      // Verify dependency modal appears
      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      // The modal should show dependency options (use first() as there are multiple matches)
      await expect(modal.getByText(/transaction/i).first()).toBeVisible();

      // Close modal without deleting
      await page.keyboard.press("Escape");
    });
  });
}
