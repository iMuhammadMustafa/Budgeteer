import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
    closeModal,
    createTransactionGroup,
    deleteItemById,
    fillTransactionGroupForm,
    navigateToRestoreTransactionGroups,
    navigateToTransactionGroups,
    openMyTabAddModal,
    openMyTabEditModal,
    openMyTabRestoreModal,
    saveForm,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading: string = "Transaction Group";

for (const mode of storageModes) {
    test.describe(`Transaction Groups CRUD [${mode}]`, () => {
        test.describe.configure({ mode: "serial" });

        // Shared page: login ONCE, reuse across all tests in this block
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await loginWithMode(page, mode);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.beforeEach(async () => {
            await navigateToTransactionGroups(page);
        });

        test("can view transaction groups list", async () => {
            await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
            await expect(page.getByRole("button", { name: "Groups" })).toBeVisible();
        });

        test("can create a new transaction group", async () => {
            const groupName = `Test Group ${Date.now()}`;

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

        test("can update a transaction group", async () => {
            const originalName = await createTransactionGroup(page, { name: `Update Test ${Date.now()}` });
            const updatedName = `Updated ${Date.now()}`;

            await openMyTabEditModal(page, originalName, heading);
            await page.getByRole("textbox", { name: "Group Name (required)" }).fill(updatedName);
            await saveForm(page);

            await expect(page.getByText(updatedName)).toBeVisible();
            await expect(page.getByText(originalName)).not.toBeVisible();
        });

        test("can soft delete a transaction group", async () => {
            const groupName = await createTransactionGroup(page, { name: `Delete Test ${Date.now()}` });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            const testId = await listItem.getAttribute("data-testid");
            const itemId = testId?.replace("list-item-", "") || "";

            await deleteItemById(page, itemId);

            await expect(page.getByText(groupName)).not.toBeVisible();
        });

        test("can restore a soft-deleted transaction group", async () => {
            const groupName = await createTransactionGroup(page, { name: `Restore Test ${Date.now()}` });

            const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            const testIdStr = await listItem.getAttribute("data-testid");
            const itemId = testIdStr?.replace("list-item-", "") || "";
            await deleteItemById(page, itemId);
            await expect(page.getByText(groupName)).not.toBeVisible();

            await navigateToRestoreTransactionGroups(page);
            await expect(page.getByText("Deleted Transaction Groups")).toBeVisible();

            const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
            await expect(deletedItem).toBeVisible();

            await openMyTabRestoreModal(page, groupName);

            const modal = page.locator(selectors.ui.modal);
            await modal.waitFor();
            await modal.getByRole("button", { name: /restore|confirm/i }).click();

            await navigateToTransactionGroups(page);
            await expect(page.getByText(groupName)).toBeVisible();
        });

        test("groups are sorted by display order (descending)", async () => {
            const timestamp = Date.now();

            const group1 = await createTransactionGroup(page, {
                name: `Order Test Low ${timestamp}`,
                displayOrder: "999100"
            });
            const group2 = await createTransactionGroup(page, {
                name: `Order Test High ${timestamp}`,
                displayOrder: "999300"
            });
            const group3 = await createTransactionGroup(page, {
                name: `Order Test Mid ${timestamp}`,
                displayOrder: "999200"
            });

            await page.waitForURL("**/Categories/Groups");
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