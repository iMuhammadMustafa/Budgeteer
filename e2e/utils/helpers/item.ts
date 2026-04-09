import { expect, Page } from "@playwright/test";
import { selectors } from "../selectors";

// ============================================
// ITEM ID HELPERS
// ============================================

export async function getMyTabItemIdByText(page: Page, itemText: string): Promise<string> {
    const listItem = page.getByTestId(selectors.myTab.listItem(itemText)).filter({ hasText: itemText });
    const testId = await listItem.getAttribute("data-testid");
    return testId?.replace("list-item-", "") || "";
}

export async function getListItemId(page: Page, itemName: string): Promise<string> {
    const listItem = page.getByTestId(/^list-item-/).filter({ hasText: itemName });
    await expect(listItem).toBeVisible();
    const testId = await listItem.getAttribute("data-testid");
    return testId?.replace("list-item-", "") || "";
}

// ============================================
// ITEM DELETE HELPERS
// ============================================

export async function deleteItemById(page: Page, itemId: string) {
    await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();
    const modal = page.locator(selectors.ui.modal);

    await modal.waitFor({ state: "visible" });
    await expect(modal).toBeVisible();

    const deleteButton = modal.getByRole("button", { name: "Delete", exact: true });

    // If Delete button is disabled, click "Also delete all" to enable it
    if (await deleteButton.isDisabled().catch(() => false)) {
        const alsoDeleteBtn = modal.getByRole("button", { name: /also delete all/i });
        if (await alsoDeleteBtn.isVisible().catch(() => false)) {
            await alsoDeleteBtn.click();
            await page.waitForTimeout(300);
        }
    }

    await expect(deleteButton).toBeEnabled({ timeout: 5000 });
    await deleteButton.click();
}

/**
 * Delete an item that has dependencies, choosing to either delete all deps or move them.
 * Uses the DeleteConfirmModal UI which shows dependency count and replacement dropdown.
 */
export async function deleteItemWithDependencies(
    page: Page,
    itemId: string,
    options: {
        action: "deleteAll" | "moveTo";
        targetItemName?: string;
    }
) {
    await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();
    const modal = page.locator(selectors.ui.modal);
    await modal.waitFor({ state: "visible" });
    await expect(modal).toBeVisible();

    if (options.action === "deleteAll") {
        // Click "Also delete all {type}" button
        const alsoDeleteBtn = modal.getByRole("button", { name: /also delete all/i });
        await expect(alsoDeleteBtn).toBeVisible();
        await alsoDeleteBtn.click();
        await page.waitForTimeout(300);
    } else if (options.action === "moveTo" && options.targetItemName) {
        // Use the replacement dropdown to select target
        const dropdownBtn = modal.getByTestId(selectors.forms.dropdownButton);
        await dropdownBtn.click();
        await page.waitForTimeout(300);
        await page.getByText(options.targetItemName, { exact: true }).first().click();
        await page.waitForTimeout(200);
    }

    const deleteButton = modal.getByRole("button", { name: "Delete", exact: true });
    await expect(deleteButton).toBeEnabled({ timeout: 5000 });
    await deleteButton.click();
    await page.waitForTimeout(500);
}
