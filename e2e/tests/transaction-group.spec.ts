import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import { closeModal, deleteItemById, navigateToRestoreTransactionGroups, navigateToTransactionGroups, openMyTabAddModal, openMyTabEditModal, openMyTabRestoreModal, saveForm } from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading: string = "Transaction Group";

for (const mode of storageModes) {
    test.describe(`Transaction Groups CRUD [${mode}]`, () => {
        if (mode === "cloud") {
            test.describe.configure({ mode: "serial" });
        }

        test.beforeEach(async ({ page }) => {
            await loginWithMode(page, mode);
            await navigateToTransactionGroups(page);
        });

        test("can view transaction groups list", async ({ page }) => {
            // The page header shows "Groups" - this is on the Categories/Groups page
            await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
            // Verify the Groups tab is active
            await expect(page.getByRole("button", { name: "Groups" })).toBeVisible();
        });

        test("can create a new transaction group", async ({ page }) => {
            const groupName = `Test Group ${Date.now()}`;

            // Create group
            await openMyTabAddModal(page, heading);
            await fillTransactionGroupForm(page, {
                name: groupName,
                type: "Income",
                displayOrder: "09999",
            });
            await saveForm(page);

            // Verify Modal is closed
            await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();

            // Verify group appears in list
            await expect(page.getByText(groupName)).toBeVisible();

            // Verify details by reopening
            await openMyTabEditModal(page, groupName, heading);
            await expect(page.getByRole("textbox", { name: "Group Name (required)" })).toHaveValue(groupName);
            await expect(
                page
                    .getByRole("list", { name: "Transaction Group Details section content" })
                    .getByTestId(selectors.forms.dropdownButton)
                    .getByTestId(selectors.forms.dropdownSelectedText)
            ).toHaveText("Income");
            await expect(page.getByRole("textbox", { name: "Display Order (required)" })).toHaveValue("9999");

            await closeModal(page, heading);
        });

        test("can update a transaction group", async ({ page }) => {
            const originalName = await createTransactionGroup(page, { name: `Update Test ${Date.now()}` });
            const updatedName = `Updated ${Date.now()}`;

            // Open edit modal
            await openMyTabEditModal(page, originalName, heading);

            // Update name
            await page.getByRole("textbox", { name: "Group Name (required)" }).fill(updatedName);
            await saveForm(page);

            // Verify updated
            await expect(page.getByText(updatedName)).toBeVisible();
            await expect(page.getByText(originalName)).not.toBeVisible();
        });

        test("can soft delete a transaction group", async ({ page }) => {
            const groupName = await createTransactionGroup(page, { name: `Delete Test ${Date.now()}` });

            // Find the item's ID in the list and delete
            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await deleteItemById(page, itemId);

            // Verify removed from list
            await expect(page.getByText(groupName)).not.toBeVisible();
        });

        test("can restore a soft-deleted transaction group", async ({ page }) => {
            // First create a group on the main page
            const groupName = await createTransactionGroup(page, { name: `Restore Test ${Date.now()}` });

            // Get item ID and delete it
            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            const testIdStr = await listItem.getAttribute("data-testid");
            const itemId = testIdStr?.replace("list-item-", "") || "";
            await deleteItemById(page, itemId);
            await expect(page.getByText(groupName)).not.toBeVisible();

            // Navigate to Restore page
            await navigateToRestoreTransactionGroups(page);
            await expect(page.getByText("Deleted Transaction Groups")).toBeVisible();

            // Find the deleted item and click restore button (RotateCcw icon)
            const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            await expect(deletedItem).toBeVisible();

            // Click the restore action button (custom action with RotateCcw icon)
            await openMyTabRestoreModal(page, groupName);

            // Confirm restore in modal
            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor();
            await modal.getByRole("button", { name: /restore|confirm/i }).click();

            // Verify restored - navigate back to transaction groups
            await navigateToTransactionGroups(page);
            await expect(page.getByText(groupName)).toBeVisible();
        });

        test("groups are sorted by display order (descending)", async ({ page }) => {
            const timestamp = Date.now();

            // Create three groups with specific display orders
            // Higher displayOrder should appear first in the list
            const group1 = await createTransactionGroup(page, {
                name: `Order Test Low ${timestamp}`,
                displayOrder: "100"
            });
            const group2 = await createTransactionGroup(page, {
                name: `Order Test High ${timestamp}`,
                displayOrder: "300"
            });
            const group3 = await createTransactionGroup(page, {
                name: `Order Test Mid ${timestamp}`,
                displayOrder: "200"
            });

            // Refresh the page to ensure proper sorting from the backend
            await page.getByTestId(selectors.myTab.refreshButton).click();
            await page.waitForTimeout(500); // Allow time for refresh

            // Get all list items and their positions
            const listItems = page.getByTestId(/^list-item-/);
            const allItems = await listItems.allTextContents();

            // Find the positions of our test groups
            const positionHigh = allItems.findIndex(text => text.includes(`Order Test High ${timestamp}`));
            const positionMid = allItems.findIndex(text => text.includes(`Order Test Mid ${timestamp}`));
            const positionLow = allItems.findIndex(text => text.includes(`Order Test Low ${timestamp}`));

            // Verify all groups exist
            expect(positionHigh).toBeGreaterThanOrEqual(0);
            expect(positionMid).toBeGreaterThanOrEqual(0);
            expect(positionLow).toBeGreaterThanOrEqual(0);

            // Verify order: High (300) should appear before Mid (200) before Low (100)
            // In descending order, higher displayOrder = earlier position (lower index)
            expect(positionHigh).toBeLessThan(positionMid);
            expect(positionMid).toBeLessThan(positionLow);
        });

        // TODO: Add test for hard delete from restore page (permanently delete instead of restore)
        // TODO: Add test for form validation errors (required fields show validation)
        // TODO: Add test for duplicate name handling
        // TODO: Add test for cancel button / escape key closes modal without saving
        // TODO: Add test for deleting a group that has associated transactions (dependency handling)
        // TODO: Add test for description field saves and displays correctly
    });
}

// ============================================
// Helpers
// ============================================

export async function fillTransactionGroupForm(
    page: Page,
    options: {
        name: string;
        type?: "Income" | "Expense" | "Transfer" | "Adjustment" | "Initial" | "Refund";
        displayOrder?: string;
        description?: string;
    }
) {
    const { name, type, displayOrder, description } = options;

    await page.getByRole("textbox", { name: "Group Name (required)" }).fill(name);

    if (type) {
        await page
            .getByRole("list", { name: "Transaction Group Details section content" })
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

    if (description) {
        await page.getByRole("textbox", { name: "Description" }).fill(description);
    }
}

async function createTransactionGroup(
    page: Page,
    options: {
        name?: string;
        type?: "Income" | "Expense" | "Transfer" | "Adjustment" | "Initial" | "Refund";
        displayOrder?: string;
        description?: string;
    } = {}
): Promise<string> {
    const name = options.name || `Test Group ${Date.now()}`;
    await openMyTabAddModal(page, heading);
    await fillTransactionGroupForm(page, {
        name,
        type: options.type || "Expense",
        displayOrder: options.displayOrder || "9999",
        description: options.description,
    });
    await saveForm(page);
    await expect(page.getByText(name)).toBeVisible();
    return name;
}