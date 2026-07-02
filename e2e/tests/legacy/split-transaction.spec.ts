import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
    createTransaction,
    fillAccountForm,
    fillCategoryForm,
    fillTransactionCategoryForm,
    fillTransactionGroupForm,
    navigateToAccountCategories,
    navigateToAccounts,
    navigateToTransactionCategories,
    navigateToTransactionGroups,
    navigateToTransactionsViaDrawer,
    openMyTabAddModal,
    saveForm,
} from "../utils/helpers";

/**
 * E2E tests for Split Transaction and Sub-Transaction Items features.
 *
 * Split Transaction:
 * - Select a transaction via long-press → click Split (scissors) button
 * - Navigates to AddTransaction in Multiple tab, pre-populated with split source data
 * - Children transactions linked via splitfromid, original is voided
 *
 * Sub-Items:
 * - Toggle "Add line items" in the single TransactionForm
 * - Add sub-items with name + amount; sum must equal transaction amount
 * - Sub-items persisted to transactionitems table
 */
const storageModes: StorageMode[] = ["local"];

for (const mode of storageModes) {
    test.describe(`Split & Sub-Items [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });

        let page: Page;
        let primaryAccountName: string;
        let expenseGroupName: string;
        let expenseCategoryName: string;
        let altExpenseCategoryName: string;

        test.beforeAll(async ({ browser }) => {
            test.setTimeout(180000);
            page = await browser.newPage();
            await loginWithMode(page, mode);

            const ts = Date.now();
            const acctCatName = `E2E SplitAC ${ts}`;
            primaryAccountName = `E2E SplitAcct ${ts}`;
            expenseGroupName = `E2E SplitGrp ${ts}`;
            expenseCategoryName = `E2E SplitCat ${ts}`;
            altExpenseCategoryName = `E2E SplitAlt ${ts}`;

            // Create Account Category
            await navigateToAccountCategories(page);
            await openMyTabAddModal(page, "Account Category");
            await fillCategoryForm(page, { name: acctCatName, type: "Asset", displayOrder: "9990" });
            await saveForm(page);
            await expect(page.getByTestId(/^list-item-/).filter({ hasText: acctCatName })).toBeVisible();

            // Create Account
            await navigateToAccounts(page);
            await openMyTabAddModal(page, "Account");
            await fillAccountForm(page, { name: primaryAccountName, categoryName: acctCatName, balance: "10000" });
            await saveForm(page);
            await expect(page.getByTestId(/^list-item-/).filter({ hasText: primaryAccountName })).toBeVisible();

            // Create Transaction Group
            await navigateToTransactionGroups(page);
            await openMyTabAddModal(page, "Transaction Group");
            await fillTransactionGroupForm(page, { name: expenseGroupName, type: "Expense", displayOrder: "9990" });
            await saveForm(page);
            await expect(page.getByTestId(/^list-item-/).filter({ hasText: expenseGroupName })).toBeVisible();

            // Create two Transaction Categories
            await navigateToTransactionCategories(page);
            await openMyTabAddModal(page);
            await fillTransactionCategoryForm(page, {
                name: expenseCategoryName,
                groupName: expenseGroupName,
                budgetAmount: "0",
                budgetFrequency: "Monthly",
                displayOrder: "9990",
            });
            await saveForm(page);
            await expect(page.getByTestId(/^list-item-/).filter({ hasText: expenseCategoryName })).toBeVisible();

            await openMyTabAddModal(page);
            await fillTransactionCategoryForm(page, {
                name: altExpenseCategoryName,
                groupName: expenseGroupName,
                budgetAmount: "0",
                budgetFrequency: "Monthly",
                displayOrder: "9989",
            });
            await saveForm(page);
            await expect(page.getByTestId(/^list-item-/).filter({ hasText: altExpenseCategoryName })).toBeVisible();
        });

        test.afterAll(async () => {
            await page.close();
        });

        // ============================
        // SPLIT TRANSACTION TESTS
        // ============================

        test("split button appears for single selected transaction", async () => {
            const txnName = `SplitBtnTest ${Date.now()}`;
            await createTransaction(page, {
                name: txnName,
                amount: "200",
                accountName: primaryAccountName,
                type: "Expense",
                categoryName: expenseCategoryName,
            });

            await navigateToTransactionsViaDrawer(page);
            await page.waitForTimeout(500);

            // Long-press to enter selection mode
            await page.getByText(txnName).first().click({ delay: 500 });
            await page.waitForTimeout(300);

            // Split button should be visible when exactly 1 selected
            const splitBtn = page.getByTestId("btn-split-transaction");
            await expect(splitBtn).toBeVisible();
        });

        test("split button hidden when multiple transactions selected", async () => {
            const txn1 = `SplitMulti1 ${Date.now()}`;
            const txn2 = `SplitMulti2 ${Date.now()}`;

            await createTransaction(page, {
                name: txn1,
                amount: "50",
                accountName: primaryAccountName,
                type: "Expense",
                categoryName: expenseCategoryName,
            });
            await createTransaction(page, {
                name: txn2,
                amount: "75",
                accountName: primaryAccountName,
                type: "Expense",
                categoryName: expenseCategoryName,
            });

            await navigateToTransactionsViaDrawer(page);
            await page.waitForTimeout(500);

            // Select first via long-press
            await page.getByText(txn1).first().click({ delay: 500 });
            await page.waitForTimeout(300);

            // Select second with regular click (multi-select)
            await page.getByText(txn2).first().click();
            await page.waitForTimeout(300);

            // Split button should NOT be visible
            const splitBtn = page.getByTestId("btn-split-transaction");
            await expect(splitBtn).not.toBeVisible();
        });

        test("split navigates to Multiple tab with pre-filled data", async () => {
            const txnName = `SplitNav ${Date.now()}`;
            await createTransaction(page, {
                name: txnName,
                amount: "300",
                accountName: primaryAccountName,
                type: "Expense",
                categoryName: expenseCategoryName,
            });

            await navigateToTransactionsViaDrawer(page);
            await page.waitForTimeout(500);

            // Long-press to select
            await page.getByText(txnName).first().click({ delay: 500 });
            await page.waitForTimeout(300);

            // Click split
            await page.getByTestId("btn-split-transaction").click();
            await page.waitForURL("**/AddTransaction**");
            await page.waitForTimeout(500);

            // Should be on Multiple tab and show the split banner
            await expect(page.getByText(/Splitting:/)).toBeVisible();
            await expect(page.getByText(txnName)).toBeVisible();
        });

        // ============================
        // SUB-ITEM TESTS
        // ============================

        test("can toggle sub-items section on and off", async () => {
            await page.goto("/AddTransaction");
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(500);

            // Sub-items section should have the toggle switch
            const toggle = page.getByTestId("switch-sub-items");
            await expect(toggle).toBeVisible();

            // By default, sub-items section content should not show
            await expect(page.getByTestId("btn-add-subitem")).not.toBeVisible();

            // Toggle on
            await toggle.click();
            await page.waitForTimeout(200);

            // Now the Add Item button should appear
            await expect(page.getByTestId("btn-add-subitem")).toBeVisible();

            // Toggle off
            await toggle.click();
            await page.waitForTimeout(200);
            await expect(page.getByTestId("btn-add-subitem")).not.toBeVisible();
        });

        test("can add and remove sub-items", async () => {
            await page.goto("/AddTransaction");
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(500);

            // Turn on sub-items
            await page.getByTestId("switch-sub-items").click();
            await page.waitForTimeout(200);

            // Add first item
            await page.getByTestId("btn-add-subitem").click();
            await page.waitForTimeout(200);

            // First sub-item should appear
            await expect(page.getByTestId("input-subitem-name-0")).toBeVisible();
            await expect(page.getByTestId("input-subitem-amount-0")).toBeVisible();

            // Add second item
            await page.getByTestId("btn-add-subitem").click();
            await page.waitForTimeout(200);
            await expect(page.getByTestId("input-subitem-name-1")).toBeVisible();

            // Remove first item
            await page.getByTestId("btn-remove-subitem-0").click();
            await page.waitForTimeout(200);

            // Only one item should remain
            await expect(page.getByTestId("input-subitem-name-0")).toBeVisible();
            await expect(page.getByTestId("input-subitem-name-1")).not.toBeVisible();
        });

        test("sub-items show balance indicator", async () => {
            await page.goto("/AddTransaction");
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(500);

            // Set amount first
            const amountInput = page.getByRole("textbox", { name: /Amount/i });
            await amountInput.fill("100");

            // Turn on sub-items
            await page.getByTestId("switch-sub-items").click();
            await page.waitForTimeout(200);

            // Add two items
            await page.getByTestId("btn-add-subitem").click();
            await page.waitForTimeout(200);
            await page.getByTestId("btn-add-subitem").click();
            await page.waitForTimeout(200);

            // Fill amounts that don't balance
            await page.getByTestId("input-subitem-amount-0").fill("40");
            await page.getByTestId("input-subitem-amount-1").fill("50");
            await page.waitForTimeout(200);

            // Should show "Remaining" text (not balanced)
            await expect(page.getByText(/Remaining:/)).toBeVisible();

            // Fix the balance
            await page.getByTestId("input-subitem-amount-1").fill("60");
            await page.waitForTimeout(200);

            // Should now show "Balanced"
            await expect(page.getByText(/Balanced/)).toBeVisible();
        });
    });
}
