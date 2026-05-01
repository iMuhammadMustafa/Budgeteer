import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  closeModal,
  createAccount,
  createCategory,
  deleteItemById,
  deleteItemWithDependencies,
  fillCategoryForm,
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToRestoreAccountCategories,
  openMyTabAddModal,
  openMyTabEditModal,
  openMyTabRestoreModal,
  saveForm,
} from "../utils/helpers";
import { selectors } from "../utils/selectors";

const storageModes: StorageMode[] = ["local", "cloud"];
const heading = "Account Category";

for (const mode of storageModes) {
  // =====================================================================
  // CRUD + RESTORE
  // =====================================================================
  test.describe(`Account Categories CRUD [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

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

    test("can create an Asset account category", async () => {
      const categoryName = `Test Asset Cat ${Date.now()}`;

      await openMyTabAddModal(page, heading);
      await fillCategoryForm(page, {
        name: categoryName,
        type: "Asset",
        displayOrder: "09999",
      });
      await saveForm(page);

      await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();
      await expect(page.getByText(categoryName)).toBeVisible();

      // Verify details by reopening
      await openMyTabEditModal(page, categoryName, heading);
      await expect(page.getByRole("textbox", { name: "Category Name (required)" })).toHaveValue(categoryName);
      await expect(
        page
          .getByRole("list", { name: "Category Details section" })
          .getByTestId(selectors.forms.dropdownButton)
          .getByTestId(selectors.forms.dropdownSelectedText),
      ).toHaveText("Asset");
      await expect(page.getByRole("textbox", { name: "Display Order (required)" })).toHaveValue("9999");

      await closeModal(page, heading);
    });

    test("can create a Liability account category", async () => {
      const categoryName = `Test Liability Cat ${Date.now()}`;

      await openMyTabAddModal(page, heading);
      await fillCategoryForm(page, {
        name: categoryName,
        type: "Liability",
        displayOrder: "09999",
      });
      await saveForm(page);

      await expect(page.getByText(categoryName)).toBeVisible();

      // Verify type persisted
      await openMyTabEditModal(page, categoryName, heading);
      await expect(
        page
          .getByRole("list", { name: "Category Details section" })
          .getByTestId(selectors.forms.dropdownButton)
          .getByTestId(selectors.forms.dropdownSelectedText),
      ).toHaveText("Liability");
      await closeModal(page, heading);
    });

    test("can update an account category name", async () => {
      const originalName = await createCategory(page, { name: `Update Test ${Date.now()}` });
      const updatedName = `Updated ${Date.now()}`;

      await openMyTabEditModal(page, originalName, heading);
      await page.getByRole("textbox", { name: "Category Name (required)" }).fill(updatedName);
      await saveForm(page);

      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(originalName)).not.toBeVisible();
    });

    test("can update account category type", async () => {
      const categoryName = await createCategory(page, {
        name: `Type Update ${Date.now()}`,
        type: "Asset",
      });

      await openMyTabEditModal(page, categoryName, heading);

      // Change type to Liability
      await page
        .getByRole("list", { name: "Category Details section" })
        .getByTestId(selectors.forms.dropdownButton)
        .click();
      await page.waitForTimeout(300);
      await page.getByText("Liability", { exact: true }).last().click();
      await saveForm(page);

      // Verify type was changed
      await openMyTabEditModal(page, categoryName, heading);
      await expect(
        page
          .getByRole("list", { name: "Category Details section" })
          .getByTestId(selectors.forms.dropdownButton)
          .getByTestId(selectors.forms.dropdownSelectedText),
      ).toHaveText("Liability");
      await closeModal(page, heading);
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

      // Delete
      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
      const testIdStr = await listItem.getAttribute("data-testid");
      const itemId = testIdStr?.replace("list-item-", "") || "";
      await deleteItemById(page, itemId);
      await expect(page.getByText(categoryName)).not.toBeVisible();

      // Restore
      await navigateToRestoreAccountCategories(page);
      await expect(page.getByText("Deleted Account Categories")).toBeVisible();

      const deletedItem = page.getByTestId(/^list-item-/).filter({ hasText: categoryName });
      await expect(deletedItem).toBeVisible();

      await openMyTabRestoreModal(page, categoryName);
      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor();
      await modal.getByRole("button", { name: /restore|confirm/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // Wait for restored item to disappear from the deleted list
      await expect(deletedItem).not.toBeVisible({ timeout: 10000 });

      await navigateToAccountCategories(page);
      await expect(page.getByText(categoryName)).toBeVisible({ timeout: 10000 });
    });

    test("categories are sorted by display order (descending)", async () => {
      const timestamp = Date.now();

      await createCategory(page, { name: `Order Test Low ${timestamp}`, displayOrder: "999100" });
      await createCategory(page, { name: `Order Test High ${timestamp}`, displayOrder: "999300" });
      await createCategory(page, { name: `Order Test Mid ${timestamp}`, displayOrder: "999200" });

      await navigateToAccountCategories(page);
      await page.waitForTimeout(1000);

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
  test.describe(`Account Category Dependencies [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);

      const timestamp = Date.now();
      testCategoryName = `Dep AccCat ${timestamp}`;

      // Create a category and an account under it
      await navigateToAccountCategories(page);
      await createCategory(page, { name: testCategoryName, type: "Asset" });

      await navigateToAccounts(page);
      await createAccount(page, {
        name: `Dep Account ${timestamp}`,
        categoryName: testCategoryName,
        balance: "100",
      });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test("deleting category with accounts shows dependency modal", async () => {
      await navigateToAccountCategories(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: testCategoryName });
      await expect(listItem).toBeVisible();

      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await page.getByTestId(selectors.myTab.deleteButton(itemId)).click();

      const modal = page.locator(selectors.ui.modal);
      await modal.waitFor({ state: "visible" });

      // Should show dependency info (account count)
      await expect(modal.getByText(/account/i).first()).toBeVisible();
      const deleteButton = modal.getByRole("button", { name: "Delete", exact: true });
      await expect(deleteButton).toBeVisible();

      await page.keyboard.press("Escape");
    });

    test("can delete category and move accounts to another category", async () => {
      const timestamp = Date.now();
      const sourceCat = `Source AccCat ${timestamp}`;
      const targetCat = `Target AccCat ${timestamp}`;
      const accountName = `Move Account ${timestamp}`;

      await navigateToAccountCategories(page);
      await createCategory(page, { name: sourceCat, type: "Asset" });
      await createCategory(page, { name: targetCat, type: "Asset" });

      await navigateToAccounts(page);
      await createAccount(page, { name: accountName, categoryName: sourceCat, balance: "0" });

      await navigateToAccountCategories(page);

      const listItem = page.getByTestId(/^list-item-/).filter({ hasText: sourceCat });
      const testId = await listItem.getAttribute("data-testid");
      const itemId = testId?.replace("list-item-", "") || "";

      await deleteItemWithDependencies(page, itemId, {
        action: "moveTo",
        targetItemName: targetCat,
      });

      await expect(page.getByText(sourceCat)).not.toBeVisible();
      await expect(page.getByText(targetCat)).toBeVisible();

      // Verify account still exists (was moved)
      await navigateToAccounts(page);
      await expect(page.getByText(accountName)).toBeVisible();
    });
  });
}
