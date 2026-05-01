import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  createTransaction,
  deleteTransaction,
  fillAccountForm,
  fillCategoryForm,
  getAccountBalanceText,
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToRestoreTransactions,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
  navigateToTransactions,
  openMyTabAddModal,
  openMyTabEditModal,
  openTransactionEditModal,
  parseBalance,
  saveForm,
  setTransactionVoidStatus,
  createTransactionGroup,
  createTransactionCategory,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading = "Account";

for (const mode of storageModes) {
  test.describe(`Account-Transaction Integration [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let sharedCategoryName: string;
    let sharedTxnGroupName: string;
    let sharedTxnCategoryName: string;
    let page: Page;
    let testAccountName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      const timestamp = Date.now();

      // Create shared account category
      sharedCategoryName = `Integration Category ${timestamp}`;
      await navigateToAccountCategories(page);
      await openMyTabAddModal(page, "Account Category");
      await fillCategoryForm(page, {
        name: sharedCategoryName,
        type: "Asset",
        displayOrder: "9999",
      });
      await saveForm(page);
      await expect(page.getByText(sharedCategoryName)).toBeVisible();

      // Create shared transaction group + category
      sharedTxnGroupName = `Integration TxnGroup ${timestamp}`;
      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: sharedTxnGroupName, type: "Expense" });

      sharedTxnCategoryName = `Integration TxnCat ${timestamp}`;
      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, {
        name: sharedTxnCategoryName,
        groupName: sharedTxnGroupName,
      });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      // Create fresh account for each test
      testAccountName = `Test Account ${Date.now()}`;
      await navigateToAccounts(page);

      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: testAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);
      await expect(page.getByText(testAccountName)).toBeVisible();
    });

    // =====================================================================
    // GROUP 1: INITIAL TRANSACTION VERIFICATION
    // =====================================================================

    test("creates 'Account Opened' transaction when account is created", async () => {
      await navigateToTransactions(page);

      await expect(page.getByText("Account Opened")).toBeVisible();

      const editPage = await openTransactionEditModal(page, "Account Opened");
      await expect(editPage.getByText(testAccountName)).toBeVisible();
      await expect(editPage.getByLabel(/Amount/i)).toHaveValue("1000");

      await navigateToTransactions(page);
    });

    test("updating 'Account Opened' transaction updates account balance", async () => {
      await navigateToTransactions(page);

      const editPage = await openTransactionEditModal(page, "Account Opened");
      await editPage.getByLabel(/Amount/i).fill("1500");
      await editPage.getByRole("button", { name: /save transaction/i }).click();
      await page.waitForURL("**/Transactions");

      await navigateToAccounts(page);
      const balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1500);
    });

    // =====================================================================
    // GROUP 2: TRANSACTION CHANGES -> ACCOUNT BALANCE
    // =====================================================================

    test("changing transaction amount updates account balance", async () => {
      const txnName = `Amount Change ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify initial balance impact (1000 - 100 = 900)
      await navigateToAccounts(page);
      let balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);

      // Edit transaction: change amount from 100 to 200
      await navigateToTransactions(page);
      const editPage = await openTransactionEditModal(page, txnName);
      await editPage.getByLabel(/Amount/i).fill("200");
      await editPage.getByRole("button", { name: /save transaction/i }).click();
      await page.waitForURL("**/Transactions");

      // Verify account balance (1000 - 200 = 800)
      await navigateToAccounts(page);
      balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(800);
    });

    test("changing transaction account updates old and new account balances", async () => {
      // Create second account
      const secondAccountName = `Second Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: secondAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      const txnName = `Account Change ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify initial balances
      await navigateToAccounts(page);
      let balanceA = await getAccountBalanceText(page, testAccountName);
      let balanceB = await getAccountBalanceText(page, secondAccountName);
      expect(parseBalance(balanceA)).toBe(900);
      expect(parseBalance(balanceB)).toBe(1000);

      // Edit transaction: move to second account
      await navigateToTransactions(page);
      const editPage = await openTransactionEditModal(page, txnName);
      await editPage.getByText(/Account\*/).click();
      await page.waitForTimeout(200);
      const searchBox = page.getByPlaceholder("Search...");
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill(secondAccountName);
        await page.waitForTimeout(300);
      }
      await page.getByText(secondAccountName, { exact: true }).last().click({ force: true });
      await page.waitForTimeout(200);

      await editPage.getByRole("button", { name: /save transaction/i }).click();
      await page.waitForURL("**/Transactions");

      // Verify both accounts updated
      await navigateToAccounts(page);
      balanceA = await getAccountBalanceText(page, testAccountName);
      balanceB = await getAccountBalanceText(page, secondAccountName);
      expect(parseBalance(balanceA)).toBe(1000); // Restored
      expect(parseBalance(balanceB)).toBe(900); // Now has the expense
    });

    test("voiding transaction restores account balance", async () => {
      const txnName = `Void Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify balance after expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      let balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);

      // Void the transaction
      await navigateToTransactions(page);
      await setTransactionVoidStatus(page, txnName, true);

      // Verify balance restored to 1000
      await navigateToAccounts(page);
      balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1000);
    });

    test("unvoiding transaction re-applies balance change", async () => {
      const txnName = `Unvoid Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Void so balance is restored
      await setTransactionVoidStatus(page, txnName, true);

      await navigateToAccounts(page);
      let balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1000);

      // Unvoid the transaction
      await navigateToTransactions(page);
      await setTransactionVoidStatus(page, txnName, false);

      // Verify balance now reflects expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);
    });

    // =====================================================================
    // GROUP 3: TRANSACTION DELETION -> ACCOUNT BALANCE
    // =====================================================================

    test("soft-deleting transaction updates account balance", async () => {
      const txnName = `Delete Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify balance after expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      let balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);

      // Delete the transaction
      await navigateToTransactions(page);
      await deleteTransaction(page, txnName);

      // Verify balance restored
      await navigateToAccounts(page);
      balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1000);
    });

    test("restoring deleted transaction re-applies balance change", async () => {
      const txnName = `Restore Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await deleteTransaction(page, txnName);

      // Verify balance restored after delete
      await navigateToAccounts(page);
      let balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1000);

      // Restore the transaction
      await navigateToRestoreTransactions(page);
      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: txnName });
      await expect(deletedItem).toBeVisible();

      await deletedItem.getByTestId(selectors.myTab.restoreButton).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor();
      await modal.getByRole("button", { name: /restore|confirm/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await expect(deletedItem).not.toBeVisible({ timeout: 10000 });

      // Verify balance reflects restored expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);
    });

    // =====================================================================
    // GROUP 4: TRANSFER TRANSACTIONS
    // =====================================================================

    test("transfer affects source and destination account balances correctly", async () => {
      const destAccountName = `Dest Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: destAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      const txnName = `Transfer Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "500",
        accountName: testAccountName,
        type: "Transfer",
        transferAccountName: destAccountName,
      });

      await navigateToAccounts(page);
      const sourceBalance = await getAccountBalanceText(page, testAccountName);
      const destBalance = await getAccountBalanceText(page, destAccountName);

      expect(parseBalance(sourceBalance)).toBe(500); // 1000 - 500
      expect(parseBalance(destBalance)).toBe(1500); // 1000 + 500
    });

    test("updating transfer amount updates both account balances", async () => {
      const destAccountName = `Dest Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: destAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      const txnName = `Transfer Update ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "500",
        accountName: testAccountName,
        type: "Transfer",
        transferAccountName: destAccountName,
      });

      // Edit transfer amount to $300
      await navigateToTransactions(page);
      const editPage = await openTransactionEditModal(page, txnName);
      await editPage.getByLabel(/Amount/i).fill("300");
      await editPage.getByRole("button", { name: /save transaction/i }).click();
      await page.waitForURL("**/Transactions");

      await navigateToAccounts(page);
      const sourceBalance = await getAccountBalanceText(page, testAccountName);
      const destBalance = await getAccountBalanceText(page, destAccountName);

      expect(parseBalance(sourceBalance)).toBe(700); // 1000 - 300
      expect(parseBalance(destBalance)).toBe(1300); // 1000 + 300
    });

    test("voiding transfer restores both account balances", async () => {
      const destAccountName = `Dest Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: destAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      const txnName = `Transfer Void ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "500",
        accountName: testAccountName,
        type: "Transfer",
        transferAccountName: destAccountName,
      });

      await navigateToTransactions(page);
      await setTransactionVoidStatus(page, txnName, true);

      await navigateToAccounts(page);
      const sourceBalance = await getAccountBalanceText(page, testAccountName);
      const destBalance = await getAccountBalanceText(page, destAccountName);

      expect(parseBalance(sourceBalance)).toBe(1000); // Restored
      expect(parseBalance(destBalance)).toBe(1000); // Restored
    });

    // =====================================================================
    // GROUP 5: ADJUSTMENT TRANSACTIONS
    // =====================================================================

    test("adjustment transaction toggle creates balance adjustment record", async () => {
      await navigateToAccounts(page);
      const modal = await openMyTabEditModal(page, testAccountName, heading);

      // Change balance from 1000 to 1500
      await modal.getByRole("textbox", { name: "Balance (required)" }).fill("1500");

      // Enable adjustment transaction toggle
      await modal.getByText("Add Adjustment Transaction").click();

      await saveForm(page);

      await navigateToTransactions(page);
      await expect(page.getByText("Balance Adjustment")).toBeVisible();

      const editPage = await openTransactionEditModal(page, "Balance Adjustment");
      await expect(editPage.getByLabel(/Amount/i)).toHaveValue("500");

      await navigateToTransactions(page);
    });

    // =====================================================================
    // GROUP 6: ACCOUNT DELETION WITH DEPENDENCIES
    // =====================================================================

    test("deleting account shows dependency options with transaction count", async () => {
      const txnName = `Dependency Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await navigateToAccounts(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testAccountName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      await expect(modal.getByText(/transaction/i)).toBeVisible();

      await expect(
        modal.getByRole("button").or(modal.getByRole("radio")).filter({ hasText: /delete|move/i }),
      ).toBeVisible();

      await page.keyboard.press("Escape");
    });

    test("delete account and all related transactions", async () => {
      const txnName = `Delete All Test ${Date.now()}`;

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await navigateToAccounts(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testAccountName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });
      await modal.getByRole("button", { name: /also delete all/i }).click();
      await page.waitForTimeout(300);
      await modal.getByRole("button", { name: "Delete", exact: true }).click();
      await page.waitForTimeout(500);

      await expect(page.getByText(testAccountName)).not.toBeVisible();

      await navigateToTransactions(page);
      await expect(page.getByText(txnName)).not.toBeVisible();
    });

    test("delete account and move transactions to another account", async () => {
      const txnName = `Move Txn Test ${Date.now()}`;

      const secondAccountName = `Target Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: secondAccountName,
        categoryName: sharedCategoryName,
        balance: "500",
      });
      await saveForm(page);

      await createTransaction(page, {
        name: txnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await navigateToAccounts(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testAccountName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      await modal.getByText(/move/i).click();
      await modal.getByTestId(selectors.forms.dropdownButton).click();
      await page.waitForTimeout(300);
      const searchBox = page.getByPlaceholder("Search...");
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill(secondAccountName);
        await page.waitForTimeout(300);
      }
      await page.getByText(secondAccountName, { exact: true }).last().click({ force: true });
      await page.waitForTimeout(200);

      await modal.getByRole("button", { name: /confirm|move|ok/i }).click();
      await page.waitForTimeout(500);

      await expect(page.getByText(testAccountName)).not.toBeVisible();

      // Verify transaction was moved to second account
      await navigateToTransactions(page);
      const editPage = await openTransactionEditModal(page, txnName);
      await expect(editPage.getByText(secondAccountName)).toBeVisible();

      await navigateToTransactions(page);
    });

    // =====================================================================
    // GROUP 7: RUNNING BALANCE <-> ACCOUNT BALANCE SYNC
    // =====================================================================

    test("account balance equals sum of transactions", async () => {
      const txn1Name = `Txn1 ${Date.now()}`;
      const txn2Name = `Txn2 ${Date.now()}`;
      const txn3Name = `Txn3 ${Date.now()}`;

      await createTransaction(page, {
        name: txn1Name,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await createTransaction(page, {
        name: txn2Name,
        amount: "200",
        accountName: testAccountName,
        type: "Income",
        categoryName: sharedTxnCategoryName,
      });

      await createTransaction(page, {
        name: txn3Name,
        amount: "50",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Expected: 1000 - 100 + 200 - 50 = 1050
      await navigateToAccounts(page);
      const balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(1050);
    });

    test("out-of-order transaction dates maintain correct running balance", async () => {
      const futureTxnName = `Future Txn ${Date.now()}`;

      await createTransaction(page, {
        name: futureTxnName,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Edit the "Account Opened" transaction to have a date from a week ago
      await navigateToTransactions(page);
      const editPage = await openTransactionEditModal(page, "Account Opened");

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateStr = pastDate.toISOString().split("T")[0];

      const dateInput = editPage.getByLabel(/Date/i);
      await dateInput.fill(dateStr);

      await editPage.getByRole("button", { name: /save transaction/i }).click();
      await page.waitForURL("**/Transactions");
      await page.waitForTimeout(500);

      // Verify final account balance is still correct: 1000 - 100 = 900
      await navigateToAccounts(page);
      const balance = await getAccountBalanceText(page, testAccountName);
      expect(parseBalance(balance)).toBe(900);
    });
  });
}
