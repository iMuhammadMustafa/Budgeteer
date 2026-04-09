import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import { closeModal, createCategory, deleteItemById, fillCategoryForm, navigateToAccountCategories, navigateToRestoreAccountCategories, openMyTabAddModal, openMyTabEditModal, openMyTabRestoreModal, saveForm } from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading: string = "Account Category";

for (const mode of storageModes) {
    test.describe(`Account Categories CRUD [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });

        // Shared page: login ONCE, reuse across all tests
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await loginWithMode(page, mode);
            await navigateToAccountCategories(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test("can view account categories list", async () => {
            await expect(page.getByText("Account Categories")).toBeVisible();
        });

        test("can create a new account category", async () => {
            const categoryName = `Test Category ${Date.now()}`;

            await openMyTabAddModal(page, heading);
            await fillCategoryForm(page, {
                name: categoryName,
                type: "Liability",
                displayOrder: "09999",
            });
            await saveForm(page);

            await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();
            await expect(page.getByText(categoryName)).toBeVisible();

            await openMyTabEditModal(page, categoryName, heading);
            await expect(page.getByRole("textbox", { name: "Category Name (required)" })).toHaveValue(categoryName);
            await expect(
                page
                    .getByRole("list", { name: "Category Details section" })
                    .getByTestId(selectors.forms.dropdownButton)
                    .getByTestId(selectors.forms.dropdownSelectedText)
            ).toHaveText("Liability");
            await expect(page.getByRole("textbox", { name: "Display Order (required)" })).toHaveValue("9999");

            await closeModal(page, heading);
        });

        test("can update an account category", async () => {
            const originalName = await createCategory(page, { name: `Update Test ${Date.now()}` });
            const updatedName = `Updated ${Date.now()}`;

            await openMyTabEditModal(page, originalName, heading);
            await page.getByRole("textbox", { name: "Category Name (required)" }).fill(updatedName);
            await saveForm(page);

            await expect(page.getByText(updatedName)).toBeVisible();
            await expect(page.getByText(originalName)).not.toBeVisible();
        });

        test("can soft delete an account category", async () => {
            const categoryName = await createCategory(page, { name: `Delete Test ${Date.now()}` });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await deleteItemById(page, itemId);
            await expect(page.getByText(categoryName)).not.toBeVisible();
        });

        test("can restore a soft-deleted category", async () => {
            const categoryName = await createCategory(page, { name: `Restore Test ${Date.now()}` });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testIdStr = await listItem.getAttribute("data-testid");
            const itemId = testIdStr?.replace("list-item-", "") || "";
            await deleteItemById(page, itemId);
            await expect(page.getByText(categoryName)).not.toBeVisible();

            await navigateToRestoreAccountCategories(page);
            await expect(page.getByText("Deleted Account Categories")).toBeVisible();

            const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            await expect(deletedItem).toBeVisible();

            await openMyTabRestoreModal(page, categoryName);

            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor();
            await modal.getByRole("button", { name: /restore|confirm/i }).click();

            await navigateToAccountCategories(page);
            await expect(page.getByText(categoryName)).toBeVisible();
        });

        test("categories are sorted by display order (descending)", async () => {
            const timestamp = Date.now();

            const category1 = await createCategory(page, {
                name: `Order Test Low ${timestamp}`,
                displayOrder: "999100"
            });
            const category2 = await createCategory(page, {
                name: `Order Test High ${timestamp}`,
                displayOrder: "999300"
            });
            const category3 = await createCategory(page, {
                name: `Order Test Mid ${timestamp}`,
                displayOrder: "999200"
            });

            await page.waitForURL("**/Categories");
            await page.getByTestId(selectors.myTab.refreshButton).click();

            const listItems = page.getByTestId(/^list-item-/);
            const allItems = await listItems.allTextContents();

            const positionHigh = allItems.findIndex(text => text.includes(`Order Test High ${timestamp}`));
            const positionMid = allItems.findIndex(text => text.includes(`Order Test Mid ${timestamp}`));
            const positionLow = allItems.findIndex(text => text.includes(`Order Test Low ${timestamp}`));

            expect(positionHigh).toBeGreaterThanOrEqual(0);
            expect(positionMid).toBeGreaterThanOrEqual(0);
            expect(positionLow).toBeGreaterThanOrEqual(0);

            expect(positionHigh).toBeLessThan(positionMid);
            expect(positionMid).toBeLessThan(positionLow);
        });
    });
}
