import { expect, Page } from "@playwright/test";
import { selectors } from "../selectors";
import { fillAmount, fillTransactionCategoryForm, fillTransactionGroupForm, selectFormDropdown, fillTransactionName } from "./fill-forms";
import { openMyTabAddModal, openTransactionEditModal, saveForm } from "./modal";

// ============================================
// TRANSACTION CREATION
// ============================================

export async function createTransaction(
    page: Page,
    options: {
        name: string;
        amount: string;
        accountName: string;
        type?: "Expense" | "Income" | "Transfer" | "Refund";
        categoryName?: string;
        transferAccountName?: string;
        isVoid?: boolean;
    }
): Promise<void> {
    const { name, amount, accountName, type = "Expense", categoryName, transferAccountName, isVoid } = options;

    await page.goto("/AddTransaction");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    await fillTransactionName(page, name);
    await fillAmount(page, amount);

    if (type !== "Expense") {
        await selectFormDropdown(page, "Type", type);
    }

    if (categoryName) {
        await selectFormDropdown(page, "Category", categoryName);
    }

    await selectFormDropdown(page, "Account", accountName);

    if (type === "Transfer" && transferAccountName) {
        await selectFormDropdown(page, "Destination Account", transferAccountName);
    }

    await page.getByRole("button", { name: /save transaction/i }).click();
    await page.waitForURL("**/Transactions");
    await page.waitForTimeout(500);

    // If isVoid requested, apply via batch update after creation
    if (isVoid) {
        await setTransactionVoidStatus(page, name, true);
    }
}

// ============================================
// TRANSACTION EDIT HELPERS
// ============================================

/**
 * Void or unvoid a transaction via the Batch Update flow on the Transactions page.
 * Assumes the page is currently on /Transactions.
 */
export async function setTransactionVoidStatus(
    page: Page,
    transactionName: string,
    isVoid: boolean
): Promise<void> {
    // Long-press to enter selection mode and select the transaction
    await page.getByText(transactionName).first().click({ delay: 500 });
    await page.waitForTimeout(300);

    // Open the Batch Update modal via the Pencil button
    await page.getByRole("button", { name: /batch update/i }).click();

    const modal = page.locator(selectors.ui.modal);
    await modal.waitFor({ state: "visible" });

    // Enable "Update Void Status" option by clicking its row
    await modal.getByText("Update Void Status").click();
    await page.waitForTimeout(200);

    // Toggle the void switch to the desired state
    const voidSwitch = modal.getByRole("switch");
    const isCurrentlyChecked = await voidSwitch.isChecked().catch(() => false);
    if (isVoid && !isCurrentlyChecked) {
        await voidSwitch.click();
        await page.waitForTimeout(200);
    } else if (!isVoid && isCurrentlyChecked) {
        await voidSwitch.click();
        await page.waitForTimeout(200);
    }

    // Apply updates
    await modal.getByRole("button", { name: /apply updates/i }).click();

    // Confirm in the BatchActionConfirmModal
    const confirmModal = page.locator(selectors.ui.modal);
    await confirmModal.waitFor({ state: "visible" });
    await confirmModal.getByRole("button", { name: /confirm|update|apply/i }).click();
    await page.waitForTimeout(500);
}

// ============================================
// TRANSACTION DELETE HELPERS
// ============================================

export async function deleteTransaction(
    page: Page,
    transactionName: string
): Promise<void> {
    // Long-press to enter selection mode
    await page.getByText(transactionName).first().click({ delay: 500 });
    await page.waitForTimeout(300);

    // Click the Delete (Trash) button
    await page.getByRole("button", { name: /delete selected/i }).click();
    await page.waitForTimeout(300);

    // Confirm deletion
    const modal = page.locator(selectors.ui.modal);
    await modal.waitFor({ state: "visible" });
    await modal.getByRole("button", { name: /confirm|delete/i }).click();
    await page.waitForTimeout(500);
}

// ============================================
// TRANSACTION VERIFICATION
// ============================================

export async function verifyTransactionExists(
    page: Page,
    options: {
        name?: string;
        type?: string;
        amount?: string;
        accountName?: string;
    }
): Promise<boolean> {
    const { name, type, amount, accountName } = options;

    let transactionLocator = page.getByRole("link");

    if (name) {
        transactionLocator = transactionLocator.filter({ hasText: name });
    }
    if (type) {
        transactionLocator = transactionLocator.filter({ hasText: type });
    }
    if (amount) {
        transactionLocator = transactionLocator.filter({ hasText: amount });
    }
    if (accountName) {
        transactionLocator = transactionLocator.filter({ hasText: accountName });
    }

    try {
        await transactionLocator.first().waitFor({ state: "visible", timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

// ============================================
// TRANSACTION GROUP / CATEGORY CREATION
// ============================================

export async function createTransactionGroup(
    page: Page,
    options: {
        name?: string;
        type?: "Income" | "Expense" | "Transfer" | "Adjustment" | "Initial" | "Refund";
        displayOrder?: string;
        description?: string;
    } = {}
): Promise<string> {
    const name = options.name || `Test Group ${Date.now()}`;
    await openMyTabAddModal(page, "Transaction Group");
    await fillTransactionGroupForm(page, {
        name,
        type: options.type || "Expense",
        displayOrder: options.displayOrder || "9999",
        description: options.description,
    });
    await saveForm(page);
    await expect(page.getByText(name)).toBeVisible({ timeout: 15000 });
    return name;
}

export async function createTransactionCategory(
    page: Page,
    options: {
        name?: string;
        groupName: string;
        budgetAmount?: string;
        budgetFrequency?: string;
        displayOrder?: string;
    }
): Promise<string> {
    const name = options.name || `Test TxnCat ${Date.now()}`;
    await openMyTabAddModal(page);
    await fillTransactionCategoryForm(page, {
        name,
        groupName: options.groupName,
        budgetAmount: options.budgetAmount || "0",
        budgetFrequency: options.budgetFrequency || "Monthly",
        displayOrder: options.displayOrder || "9999",
    });
    await saveForm(page);
    await expect(page.getByText(name)).toBeVisible({ timeout: 15000 });
    return name;
}
