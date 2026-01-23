import { expect, Page } from "@playwright/test";
import { selectors } from "./selectors";

// ============================================
// NAVIGATION HELPERS
// ============================================

export async function navigateToAccountCategories(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /accounts/i }).click();
    await page.getByLabel("Categories").first().click();
    await page.waitForURL("**/Categories");
}

export async function navigateToRestoreAccountCategories(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /restore/i }).click();
    await page.getByLabel("Account Categories").click();
    await page.waitForURL("**/Restore/AccountCategories");
}

export async function navigateToTransactionGroups(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /categories/i }).click();
    await page.getByLabel("Groups").first().click();
    await page.waitForURL("**/Categories/Groups");
}

export async function navigateToRestoreTransactionGroups(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /restore/i }).click();
    await page.getByLabel("Transaction Groups").click();
    await page.waitForURL("**/Restore/TransactionGroups");
}

export async function navigateToAccounts(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("link", { name: /accounts/i }).click();
    await page.waitForURL("**/Accounts");
}

export async function navigateToRestoreAccounts(page: Page) {
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("button", { name: /restore/i }).click();
    await page.getByLabel("Accounts").click();
    await page.waitForURL("**/Restore/Accounts");
}

// ============================================
// MODAL HELPERS
// ============================================

export async function openMyTabAddModal(page: Page, heading?: string) {
    await page.getByTestId(selectors.myTab.addButton).click();
    await page.waitForSelector(selectors.ui.modal);
    if (heading) {
        await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
}

export async function openMyTabEditModal(page: Page, itemName: string, heading?: string) {
    await page.getByText(itemName).click();
    await page.waitForSelector(selectors.ui.modal);
    if (heading) {
        await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
}

export async function openMyTabRestoreModal(page: Page, itemText: string) {
    const listItem = page.getByTestId(/^list-item-/).filter({ hasText: itemText });
    await expect(listItem).toBeVisible();
    await listItem.getByTestId(selectors.myTab.restoreButton).click();
}

export async function closeModal(page: Page, heading?: string) {
    await page.keyboard.press("Escape");
    if (heading) {
        await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();
    }
}

export async function confirmAction(page: Page, buttonPattern: RegExp = /confirm|restore|delete|yes/i) {
    await page.waitForSelector(selectors.ui.modal);
    await page.getByRole("button", { name: buttonPattern }).click();
}

export async function saveForm(page: Page) {
    await page.getByRole("button", { name: /save|submit/i }).click();
}

// ============================================
// ITEM HELPERS
// ============================================

export async function getMyTabItemIdByText(page: Page, itemText: string): Promise<string> {
    // const listItem = page.locator(`[data-testid^="list-item-"]`).filter({ hasText: itemText });
    const listItem = page.getByTestId(selectors.myTab.listItem(itemText)).filter({ hasText: itemText });
    const testId = await listItem.getAttribute("data-testid");
    return testId?.replace("list-item-", "") || "";
}

export async function deleteItemById(page: Page, itemId: string) {
    await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();
    const modal = page.locator(selectors.ui.modal);

    await modal.waitFor({ state: "visible" });
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: /confirm|delete/i }).click();
}