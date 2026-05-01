import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  closeModal,
  createTransactionCategory,
  createTransactionGroup,
  deleteItemById,
  deleteItemWithDependencies,
  fillTransactionGroupForm,
  navigateToRestoreTransactionGroups,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
  openMyTabAddModal,
  openMyTabEditModal,
  openMyTabRestoreModal,
  saveForm,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading = "Transaction Group";

for (const mode of storageModes) {
  // =====================================================================
  // CRUD + RESTORE
  // =====================================================================
  test.describe(`Transaction Groups CRUD [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

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

      await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();
      await expect(page.getByText(groupName)).toBeVisible();

      // Verify details by reopening
      await openMyTabEditModal(page, groupName, heading);
      await expect(page.getByRole("textbox", { name: "Group Name (required)" })).toHaveValue(groupName);
      await expect(
        page
          .getByRole("list", { name: "Transaction Group Details section content" })
          .getByTestId(selectors.forms.dropdownButton)
          .getByTestId(selectors.forms.dropdownSelectedText),
      ).toHaveText("Income");
      await expect(page.getByRole("textbox", { name: "Display Order (required)" })).toHaveValue("9999");

      await closeModal(page, heading);
    });

    test("can create groups of each type", async () => {
      const types = ["Expense", "Transfer", "Adjustment"] as const;
      for (const type of types) {
        const groupName = `${type} Group ${Date.now()}`;

        await openMyTabAddModal(page, heading);
        await fillTransactionGroupForm(page, { name: groupName, type, displayOrder: "09999" });
        await saveForm(page);

        await expect(page.getByText(groupName)).toBeVisible();
      }
    });

    test("can update a transaction group name", async () => {
      const originalName = await createTransactionGroup(page, { name: `Update Test ${Date.now()}` });
      const updatedName = `Updated ${Date.now()}`;

      await openMyTabEditModal(page, originalName, heading);
      await page.getByRole("textbox", { name: "Group Name (required)" }).fill(updatedName);
      await saveForm(page);

      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(originalName)).not.toBeVisible();
    });

    test("can update a transaction group type", async () => {
      const groupName = await createTransactionGroup(page, {
        name: `Type Update ${Date.now()}`,
        type: "Income",
      });

      await openMyTabEditModal(page, groupName, heading);

      // Change type to Expense
      await page
        .getByRole("list", { name: "Transaction Group Details section content" })
        .getByTestId(selectors.forms.dropdownButton)
        .click();
      await page.waitForTimeout(300);
      await page.getByText("Expense", { exact: true }).last().click();
      await saveForm(page);

      // Verify type was changed
      await openMyTabEditModal(page, groupName, heading);
      await expect(
        page
          .getByRole("list", { name: "Transaction Group Details section content" })
          .getByTestId(selectors.forms.dropdownButton)
          .getByTestId(selectors.forms.dropdownSelectedText),
      ).toHaveText("Expense");
      await closeModal(page, heading);
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

      // Delete the group
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
      const testIdStr = await listItem.getAttribute("data-testid");
      const itemId = testIdStr?.replace("list-item-", "") || "";
      await deleteItemById(page, itemId);
      await expect(page.getByText(groupName)).not.toBeVisible();

      // Navigate to restore page
      await navigateToRestoreTransactionGroups(page);
      await expect(page.getByText("Deleted Transaction Groups")).toBeVisible();

      // Verify deleted item appears
      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
      await expect(deletedItem).toBeVisible();

      // Restore it
      await openMyTabRestoreModal(page, groupName);
      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor();
      await modal.getByRole("button", { name: /restore|confirm/i }).click();

      // Verify it's back in the main list
      await navigateToTransactionGroups(page);
      await expect(page.getByText(groupName)).toBeVisible();
    });

    test("groups are sorted by display order (descending)", async () => {
      const timestamp = Date.now();

      await createTransactionGroup(page, {
        name: `Order Test Low ${timestamp}`,
        displayOrder: "999100",
      });
      await createTransactionGroup(page, {
        name: `Order Test High ${timestamp}`,
        displayOrder: "999300",
      });
      await createTransactionGroup(page, {
        name: `Order Test Mid ${timestamp}`,
        displayOrder: "999200",
      });

      await page.waitForURL("**/Categories/Groups");
      await page.getByTestId(selectors.myTab.refreshButton).click();

      const listItems = page.getByTestId(/^list-item-/);
      const allItems = await listItems.allTextContents();

      const positionHigh = allItems.findIndex((text) => text.includes(`Order Test High ${timestamp}`));
      const positionMid = allItems.findIndex((text) => text.includes(`Order Test Mid ${timestamp}`));
      const positionLow = allItems.findIndex((text) => text.includes(`Order Test Low ${timestamp}`));

      expect(positionHigh).toBeGreaterThanOrEqual(0);
      expect(positionMid).toBeGreaterThanOrEqual(0);
      expect(positionLow).toBeGreaterThanOrEqual(0);

      expect(positionHigh).toBeLessThan(positionMid);
      expect(positionMid).toBeLessThan(positionLow);
    });
  });

  // =====================================================================
  // DEPENDENCY HANDLING
  // =====================================================================
  test.describe(`Transaction Group Dependencies [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testGroupName: string;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      const timestamp = Date.now();
      testGroupName = `Dep Group ${timestamp}`;
      testCategoryName = `Dep Category ${timestamp}`;

      // Create a group and a category under it
      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: testGroupName, type: "Expense" });

      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, {
        name: testCategoryName,
        groupName: testGroupName,
      });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test("deleting group with categories shows dependency modal", async () => {
      await navigateToTransactionGroups(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testGroupName });
      await expect(listItem).toBeVisible();

      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      // Should show dependency info (category count)
      await expect(modal.getByText(/categor/i)).toBeVisible();
      const deleteButton = modal.getByRole("button", { name: "Delete", exact: true });
      await expect(deleteButton).toBeVisible();

      await page.keyboard.press("Escape");
    });

    test("can delete group and all its categories", async () => {
      const timestamp = Date.now();
      const groupName = `DelAll Group ${timestamp}`;
      const catName = `DelAll Cat ${timestamp}`;

      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: groupName, type: "Expense" });

      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, { name: catName, groupName });

      await navigateToTransactionGroups(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: groupName });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await deleteItemWithDependencies(page, itemId, { action: "deleteAll" });

      await expect(page.getByText(groupName)).not.toBeVisible();

      // Verify category was also removed
      await navigateToTransactionCategories(page);
      await expect(page.getByText(catName)).not.toBeVisible();
    });

    test("can delete group and move categories to another group", async () => {
      const timestamp = Date.now();
      const sourceGroup = `Source Group ${timestamp}`;
      const targetGroup = `Target Group ${timestamp}`;
      const catName = `Move Cat ${timestamp}`;

      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: sourceGroup, type: "Expense" });
      await createTransactionGroup(page, { name: targetGroup, type: "Expense" });

      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, { name: catName, groupName: sourceGroup });

      await navigateToTransactionGroups(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: sourceGroup });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await deleteItemWithDependencies(page, itemId, {
        action: "moveTo",
        targetItemName: targetGroup,
      });

      await expect(page.getByText(sourceGroup)).not.toBeVisible();
      await expect(page.getByText(targetGroup)).toBeVisible();

      // Verify category still exists (was moved, not deleted)
      await navigateToTransactionCategories(page);
      await expect(page.getByText(catName)).toBeVisible();
    });
  });
}
