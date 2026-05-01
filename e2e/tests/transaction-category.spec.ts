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
  // =====================================================================
  // CRUD + RESTORE
  // =====================================================================
  test.describe(`Transaction Categories CRUD [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
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

      // Verify details by reopening
      await openMyTabEditModal(page, categoryName);
      await expect(page.getByRole("textbox", { name: "Category Name (required)" })).toHaveValue(categoryName);
      await closeModal(page);
    });

    test("can create category with budget amount", async () => {
      const categoryName = `Budget Cat ${Date.now()}`;

      await openMyTabAddModal(page);
      await fillTransactionCategoryForm(page, {
        name: categoryName,
        groupName: testGroupName,
        budgetAmount: "500",
        budgetFrequency: "Monthly",
        displayOrder: "09999",
      });
      await saveForm(page);

      await expect(page.getByText(categoryName)).toBeVisible();

      // Verify budget amount persisted
      await openMyTabEditModal(page, categoryName);
      await expect(page.getByRole("textbox", { name: "Budget Amount (required)" })).toHaveValue("500");
      await closeModal(page);
    });

    test("can update a transaction category name", async () => {
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

    test("can change transaction category group", async () => {
      // Create a second group
      const secondGroupName = `Second Group ${Date.now()}`;
      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: secondGroupName, type: "Income" });

      // Create category in original group
      await navigateToTransactionCategories(page);
      const categoryName = await createTransactionCategory(page, {
        name: `Group Change Cat ${Date.now()}`,
        groupName: testGroupName,
      });

      // Edit and change the group
      await openMyTabEditModal(page, categoryName);

      const categorySection = page.getByRole("list", { name: "Category Details section content" });
      await categorySection.getByTestId(selectors.forms.dropdownButton).click();
      await page.waitForTimeout(300);
      const searchBox = page.getByPlaceholder("Search...");
      if (await searchBox.isVisible().catch(() => false)) {
        await searchBox.fill(secondGroupName);
        await page.waitForTimeout(300);
      }
      await page.getByText(secondGroupName, { exact: true }).last().click({ force: true });
      await page.waitForTimeout(200);

      await saveForm(page);

      // Verify category still exists after group change
      await expect(page.getByText(categoryName)).toBeVisible();
    });

    test("can soft delete a transaction category", async () => {
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
      const categoryName = await createTransactionCategory(page, {
        name: `Restore TxnCat ${Date.now()}`,
        groupName: testGroupName,
      });

      // Delete
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
      const testIdStr = await listItem.getAttribute("data-testid");
      const itemId = testIdStr?.replace("list-item-", "") || "";
      await deleteItemById(page, itemId);
      await expect(page.getByText(categoryName)).not.toBeVisible();

      // Restore
      await navigateToRestoreTransactionCategories(page);
      await expect(page.getByText("Deleted Transaction Categories")).toBeVisible();

      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
      await expect(deletedItem).toBeVisible();
      await openMyTabRestoreModal(page, categoryName);

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor();
      await modal.getByRole("button", { name: /restore|confirm/i }).click();

      // Verify restored
      await navigateToTransactionCategories(page);
      await expect(page.getByText(categoryName)).toBeVisible();
    });

    test("categories are sorted by display order (descending)", async () => {
      const timestamp = Date.now();

      await createTransactionCategory(page, {
        name: `Order Low ${timestamp}`,
        groupName: testGroupName,
        displayOrder: "999100",
      });
      await createTransactionCategory(page, {
        name: `Order High ${timestamp}`,
        groupName: testGroupName,
        displayOrder: "999300",
      });
      await createTransactionCategory(page, {
        name: `Order Mid ${timestamp}`,
        groupName: testGroupName,
        displayOrder: "999200",
      });

      await page.getByTestId(selectors.myTab.refreshButton).click();
      await page.waitForTimeout(500);

      const listItems = page.getByTestId(/^list-item-/);
      const allItems = await listItems.allTextContents();

      const posHigh = allItems.findIndex((t) => t.includes(`Order High ${timestamp}`));
      const posMid = allItems.findIndex((t) => t.includes(`Order Mid ${timestamp}`));
      const posLow = allItems.findIndex((t) => t.includes(`Order Low ${timestamp}`));

      expect(posHigh).toBeGreaterThanOrEqual(0);
      expect(posMid).toBeGreaterThanOrEqual(0);
      expect(posLow).toBeGreaterThanOrEqual(0);

      expect(posHigh).toBeLessThan(posMid);
      expect(posMid).toBeLessThan(posLow);
    });
  });

  // =====================================================================
  // DEPENDENCY HANDLING
  // =====================================================================
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

    test("deleting category shows dependency modal with delete button", async () => {
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
