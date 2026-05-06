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
      test.setTimeout(120000);
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

      await expect(page.getByText("Account Opened")).toBeVisible({ timeout: 15000 });

      const editPage = await openTransactionEditModal(page, "Account Opened");
      await expect(editPage.getByText(testAccountName)).toBeVisible();
      await expect(editPage.getByRole("textbox", { name: "Amount (required)" })).toHaveValue("1000");

      await navigateToTransactions(page);
    });

    test("creating expense reduces account balance from initial 1000", async () => {
      // Create an expense transaction of $200 against the test account
      await createTransaction(page, {
        name: `Balance Test Expense ${Date.now()}`,
        amount: "200",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      await navigateToAccounts(page);
      await expect(async () => {
        const balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance)).toBe(800);
      }).toPass({ timeout: 15000 });
    });

    // =====================================================================
    // GROUP 2: TRANSACTION CHANGES -> ACCOUNT BALANCE
    // =====================================================================

    test("multiple expenses reduce account balance cumulatively", async () => {
      const txnName1 = `Cumulative Expense 1 ${Date.now()}`;
      const txnName2 = `Cumulative Expense 2 ${Date.now()}`;

      // Create first expense of $100
      await createTransaction(page, {
        name: txnName1,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify balance after first expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(900);
      }).toPass({ timeout: 15000 });

      // Create second expense of $200
      await createTransaction(page, {
        name: txnName2,
        amount: "200",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify cumulative balance (1000 - 100 - 200 = 700)
      await navigateToAccounts(page);
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(700);
      }).toPass({ timeout: 15000 });
    });

    test("expenses on different accounts affect their balances independently", async () => {
      // Create second account
      const secondAccountName = `Second Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: secondAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      // Create expense on first account
      await createTransaction(page, {
        name: `Expense A ${Date.now()}`,
        amount: "100",
        accountName: testAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Create expense on second account
      await createTransaction(page, {
        name: `Expense B ${Date.now()}`,
        amount: "250",
        accountName: secondAccountName,
        type: "Expense",
        categoryName: sharedTxnCategoryName,
      });

      // Verify each account's balance is affected independently
      await navigateToAccounts(page);
      await expect(async () => {
        const balanceA = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balanceA)).toBe(900); // 1000 - 100
      }).toPass({ timeout: 15000 });
      await expect(async () => {
        const balanceB = await getAccountBalanceText(page, secondAccountName);
        expect(parseBalance(balanceB)).toBe(750); // 1000 - 250
      }).toPass({ timeout: 15000 });
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
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(900);
      }).toPass({ timeout: 15000 });

      // Void the transaction
      await navigateToTransactions(page);
      await setTransactionVoidStatus(page, txnName, true);

      // Navigate to accounts and verify balance restored to 1000
      await navigateToAccounts(page);
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(1000);
      }).toPass({ timeout: 15000 });
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

      // Verify balance restored
      await navigateToAccounts(page);
      await expect(async () => {
        const balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance)).toBe(1000);
      }).toPass({ timeout: 15000 });

      // Unvoid the transaction
      await navigateToTransactions(page);
      await setTransactionVoidStatus(page, txnName, false);

      // Verify balance now reflects expense (1000 - 100 = 900)
      await navigateToAccounts(page);
      await expect(async () => {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
        const balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance)).toBe(900);
      }).toPass({ timeout: 30000 });
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
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(900);
      }).toPass({ timeout: 15000 });

      // Delete the transaction
      await navigateToTransactions(page);
      await deleteTransaction(page, txnName);

      // Verify balance restored
      await navigateToAccounts(page);
      await expect(async () => {
        const bal = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(bal)).toBe(1000);
      }).toPass({ timeout: 15000 });
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
      let balance: string;
      await expect(async () => {
        balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance!)).toBe(1000);
      }).toPass({ timeout: 15000 });

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
      await navigateToTransactions(page);
      await navigateToAccounts(page);
      await expect(async () => {
        balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance!)).toBe(900);
      }).toPass({ timeout: 15000 });
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
      await expect(async () => {
        const sourceBalance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(sourceBalance)).toBe(500); // 1000 - 500
      }).toPass({ timeout: 15000 });
      await expect(async () => {
        const destBalance = await getAccountBalanceText(page, destAccountName);
        expect(parseBalance(destBalance)).toBe(1500); // 1000 + 500
      }).toPass({ timeout: 15000 });
    });

    test("multiple transfers update both account balances cumulatively", async () => {
      const destAccountName = `Dest Account ${Date.now()}`;
      await openMyTabAddModal(page, heading);
      await fillAccountForm(page, {
        name: destAccountName,
        categoryName: sharedCategoryName,
        balance: "1000",
      });
      await saveForm(page);

      // First transfer: $200
      await createTransaction(page, {
        name: `Transfer 1 ${Date.now()}`,
        amount: "200",
        accountName: testAccountName,
        type: "Transfer",
        transferAccountName: destAccountName,
      });

      // Second transfer: $300
      await createTransaction(page, {
        name: `Transfer 2 ${Date.now()}`,
        amount: "300",
        accountName: testAccountName,
        type: "Transfer",
        transferAccountName: destAccountName,
      });

      await navigateToAccounts(page);
      await expect(async () => {
        const sourceBalance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(sourceBalance)).toBe(500); // 1000 - 200 - 300
      }).toPass({ timeout: 15000 });
      await expect(async () => {
        const destBalance = await getAccountBalanceText(page, destAccountName);
        expect(parseBalance(destBalance)).toBe(1500); // 1000 + 200 + 300
      }).toPass({ timeout: 15000 });
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
      await expect(async () => {
        const sourceBalance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(sourceBalance)).toBe(1000); // Restored
      }).toPass({ timeout: 15000 });
      await expect(async () => {
        const destBalance = await getAccountBalanceText(page, destAccountName);
        expect(parseBalance(destBalance)).toBe(1000); // Restored
      }).toPass({ timeout: 15000 });
    });

    // =====================================================================
    // GROUP 5: ADJUSTMENT TRANSACTIONS
    // =====================================================================

    test("adjustment transaction toggle is available when editing account", async () => {
      await navigateToAccounts(page);
      const modal = await openMyTabEditModal(page, testAccountName, heading);

      // Verify the adjustment transaction toggle is present
      await expect(modal.getByText("Add Adjustment Transaction")).toBeVisible();

      // Close without saving
      await page.keyboard.press("Escape");
      await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
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
      const deleteBtn = modal.getByRole("button", { name: "Delete", exact: true });
      await expect(deleteBtn).toBeEnabled({ timeout: 5000 });
      await deleteBtn.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 }).catch(() => {});

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
      const searchBox = page.getByPlaceholder("Search...");
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill(secondAccountName);
      }
      const acctOption = page.getByText(secondAccountName, { exact: true }).last();
      await acctOption.waitFor({ state: "visible" });
      await acctOption.click({ force: true });

      await modal.getByRole("button", { name: /confirm|move|ok/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 }).catch(() => {});

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
      await expect(async () => {
        const balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance)).toBe(1050);
      }).toPass({ timeout: 15000 });
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

      // Verify final account balance is still correct: 1000 - 100 = 900
      await navigateToAccounts(page);
      await expect(async () => {
        const balance = await getAccountBalanceText(page, testAccountName);
        expect(parseBalance(balance)).toBe(900);
      }).toPass({ timeout: 15000 });
    });
  });
}
