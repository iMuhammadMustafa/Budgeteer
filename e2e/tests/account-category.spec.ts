import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import { closeModal, deleteItemById, navigateToAccountCategories, navigateToRestoreAccountCategories, openMyTabAddModal, openMyTabEditModal, openMyTabRestoreModal, saveForm } from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading: string = "Account Category";


for (const mode of storageModes) {
    test.describe(`Account Categories CRUD [${mode}]`, () => {
        // test.describe.configure({ mode: "serial" });

        test.beforeEach(async ({ page }) => {
            await loginWithMode(page, mode);
            await navigateToAccountCategories(page);
        });

        test("can view account categories list", async ({ page }) => {
            await expect(page.getByText("Account Categories")).toBeVisible();
        });

        test("can create a new account category", async ({ page }) => {
            const categoryName = `Test Category ${Date.now()}`;

            // Create category
            await openMyTabAddModal(page, heading);
            await fillCategoryForm(page, {
                name: categoryName,
                type: "Liability",
                displayOrder: "09999",
            });
            await saveForm(page);

            //Verify Modal is closed
            await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();

            // Verify category appears in list
            await expect(page.getByText(categoryName)).toBeVisible();

            // Verify details by reopening
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

        test("can update an account category", async ({ page }) => {
            const originalName = await createCategory(page, { name: `Update Test ${Date.now()}` });
            const updatedName = `Updated ${Date.now()}`;

            // Open edit modal
            await openMyTabEditModal(page, originalName, heading);

            // Update name
            await page.getByRole("textbox", { name: "Category Name (required)" }).fill(updatedName);
            await saveForm(page);

            // Verify updated
            await expect(page.getByText(updatedName)).toBeVisible();
            await expect(page.getByText(originalName)).not.toBeVisible();
        });

        test("can soft delete an account category", async ({ page }) => {
            const categoryName = await createCategory(page, { name: `Delete Test ${Date.now()}` });

            // Find the item's ID in the list and delete
            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await deleteItemById(page, itemId);

            // Verify removed from list
            await expect(page.getByText(categoryName)).not.toBeVisible();
        });

        test("can restore a soft-deleted category", async ({ page }) => {
            // First create a category on the main page
            const categoryName = await createCategory(page, { name: `Restore Test ${Date.now()}` });

            // Get item ID and delete it
            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            const testIdStr = await listItem.getAttribute("data-testid");
            const itemId = testIdStr?.replace("list-item-", "") || "";
            await deleteItemById(page, itemId);
            await expect(page.getByText(categoryName)).not.toBeVisible();

            // Navigate to Restore page
            await navigateToRestoreAccountCategories(page);
            await expect(page.getByText("Deleted Account Categories")).toBeVisible();

            // Find the deleted item and click restore button (RotateCcw icon)
            const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
            await expect(deletedItem).toBeVisible();

            // Click the restore action button (custom action with RotateCcw icon)
            await openMyTabRestoreModal(page, categoryName);

            // Confirm restore in modal
            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor();
            await modal.getByRole("button", { name: /restore|confirm/i }).click();

            // Verify restored - navigate back to categories
            await navigateToAccountCategories(page);
            await expect(page.getByText(categoryName)).toBeVisible();
        });

        test("categories are sorted by display order (descending)", async ({ page }) => {
            const timestamp = Date.now();

            // Create three categories with specific display orders
            // Higher displayOrder should appear first in the list
            const category1 = await createCategory(page, {
                name: `Order Test Low ${timestamp}`,
                displayOrder: "100"
            });
            const category2 = await createCategory(page, {
                name: `Order Test High ${timestamp}`,
                displayOrder: "300"
            });
            const category3 = await createCategory(page, {
                name: `Order Test Mid ${timestamp}`,
                displayOrder: "200"
            });

            // Refresh the page to ensure proper sorting from the backend
            await page.getByTestId(selectors.myTab.refreshButton).click();
            await page.waitForTimeout(500); // Allow time for refresh

            // Get all list items and their positions
            const listItems = page.getByTestId(/^list-item-/);
            const allItems = await listItems.allTextContents();

            // Find the positions of our test categories
            const positionHigh = allItems.findIndex(text => text.includes(`Order Test High ${timestamp}`));
            const positionMid = allItems.findIndex(text => text.includes(`Order Test Mid ${timestamp}`));
            const positionLow = allItems.findIndex(text => text.includes(`Order Test Low ${timestamp}`));

            // Verify all categories exist
            expect(positionHigh).toBeGreaterThanOrEqual(0);
            expect(positionMid).toBeGreaterThanOrEqual(0);
            expect(positionLow).toBeGreaterThanOrEqual(0);

            // Verify order: High (300) should appear before Mid (200) before Low (100)
            // In descending order, higher displayOrder = earlier position (lower index)
            expect(positionHigh).toBeLessThan(positionMid);
            expect(positionMid).toBeLessThan(positionLow);
        });
    });
}

// ============================================
// HELPERS
// ============================================

export async function fillCategoryForm(
    page: Page,
    options: {
        name: string;
        type?: "Asset" | "Liability";
        displayOrder?: string;
    }
) {
    const { name, type, displayOrder } = options;

    await page.getByRole("textbox", { name: "Category Name (required)" }).fill(name);

    if (type) {
        await page
            .getByRole("list", { name: "Category Details section" })
            .getByTestId(selectors.forms.dropdownButton)
            .click();
        await page
            .locator("div")
            .filter({ hasText: new RegExp(`^${type}$`) })
            .nth(1)
            .click();
    }

    if (displayOrder) {
        await page.getByRole("textbox", { name: "Display Order (required)" }).fill(displayOrder);
    }
}

export async function createCategory(
    page: Page,
    options: {
        name?: string;
        type?: "Asset" | "Liability";
        displayOrder?: string;
    } = {}
): Promise<string> {
    const name = options.name || `Test Category ${Date.now()}`;
    await openMyTabAddModal(page, "Account Category");
    await fillCategoryForm(page, {
        name,
        type: options.type || "Asset",
        displayOrder: options.displayOrder || "9999",
    });
    await saveForm(page);
    await expect(page.getByText(name)).toBeVisible();
    return name;
}