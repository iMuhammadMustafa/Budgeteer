import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
    closeModal,
    createTransactionCategory,
    createTransactionGroup,
    deleteItemById,
    fillTransactionCategoryForm,
    navigateToRestoreTransactionCategories,
    navigateToTransactionCategories,
    navigateToTransactionGroups,
    openMyTabAddModal,
    openMyTabEditModal,
    openMyTabRestoreModal,
    saveForm,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];

for (const mode of storageModes) {
    test.describe(`Transaction Categories CRUD [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });

        let page: Page;
        // Self-contained: create a group in beforeAll instead of relying on seed data
        // TODO: Make the app not depend on seed data — groups like "Car" should be configurable, not required
        let testGroupName: string;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await loginWithMode(page, mode);

            // Create prerequisite group
            testGroupName = `E2E Group ${Date.now()}`;
            await navigateToTransactionGroups(page);
            await createTransactionGroup(page, {
                name: testGroupName,
                type: "Expense",
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.beforeEach(async () => {
            await navigateToTransactionCategories(page);
        });

        test("can view transaction categories list", async () => {
            await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
            await expect(page.getByRole("button", { name: "Groups" })).toBeVisible();
        });

        test("can create a new transaction category", async () => {
            await navigateToTransactionCategories(page);
            const categoryName = `Test TxnCat ${Date.now()}`;

            await openMyTabAddModal(page);
            await fillTransactionCategoryForm(page, {
                name: categoryName,
                groupName: testGroupName,
                budgetFrequency: "Monthly",
                displayOrder: "09999",
            });
            await saveForm(page);

            await expect(page.locator(selectors.ui.modal)).not.toBeVisible();
            await expect(page.getByText(categoryName)).toBeVisible();

            await openMyTabEditModal(page, categoryName);
            await expect(page.getByRole("textbox", { name: "Category Name (required)" })).toHaveValue(categoryName);
            await closeModal(page);
        });

        test("can update a transaction category", async () => {
            await navigateToTransactionCategories(page);
            const originalName = await createTransactionCategory(page, {
                name: `Update TxnCat ${Date.now()}`,
                groupName: testGroupName,
            });
            const updatedName = `Updated TxnCat ${Date.now()}`;

            await openMyTabEditModal(page, originalName);
            await page.getByRole("textbox", { name: "Category Name (required)" }).fill(updatedName);
            await saveForm(page);

            await expect(page.getByText(updatedName)).toBeVisible();
            await expect(page.getByText(originalName)).not.toBeVisible();
        });

        test("can soft delete a transaction category", async () => {
            await navigateToTransactionCategories(page);
            const categoryName = await createTransactionCategory(page, {
                name: `Delete TxnCat ${Date.now()}`,
                groupName: testGroupName,
            });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await deleteItemById(page, itemId);

            await expect(page.getByText(categoryName)).not.toBeVisible();
        });

        test("can restore a soft-deleted category", async () => {
            await navigateToTransactionCategories(page);
            const categoryName = await createTransactionCategory(page, {
                name: `Restore TxnCat ${Date.now()}`,
                groupName: testGroupName,
            });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testIdStr = await listItem.getAttribute("data-testid");
            const itemId = testIdStr?.replace("list-item-", "") || "";
            await deleteItemById(page, itemId);
            await expect(page.getByText(categoryName)).not.toBeVisible();

            await navigateToRestoreTransactionCategories(page);
            await expect(page.getByText("Deleted Transaction Categories")).toBeVisible();

            const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            await expect(deletedItem).toBeVisible();
            await openMyTabRestoreModal(page, categoryName);

            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor();
            await modal.getByRole("button", { name: /restore|confirm/i }).click();

            await navigateToTransactionCategories(page);
            await expect(page.getByText(categoryName)).toBeVisible();
        });
    });

    test.describe(`Transaction Category Dependencies [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });

        let page: Page;
        let testGroupName: string;
        let testCategoryName: string;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await loginWithMode(page, mode);

            testGroupName = `Dep Group ${Date.now()}`;
            testCategoryName = `Dep Category ${Date.now()}`;

            // Create a group
            await navigateToTransactionGroups(page);
            await createTransactionGroup(page, {
                name: testGroupName,
                type: "Expense",
            });

            // Create a category in that group
            await navigateToTransactionCategories(page);
            await createTransactionCategory(page, {
                name: testCategoryName,
                groupName: testGroupName,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test("deleting category shows dependency modal", async () => {
            await navigateToTransactionCategories(page);

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testCategoryName });
            await expect(listItem).toBeVisible();

            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor({ state: "visible" });

            const deleteButton = modal.getByRole("button", { name: "Delete", exact: true });
            await expect(deleteButton).toBeVisible();

            await page.keyboard.press("Escape");
        });
    });
}
