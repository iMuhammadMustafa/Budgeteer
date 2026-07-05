import { gotoApp, test } from "../fixtures/app";
import {
  createAccountCategory,
  createTransactionCategory,
  createTransactionGroup,
  deleteItemById,
  getItemId,
  listItem,
  openEditFormById,
  waitForOverlayClosed,
} from "../utils/forms";
import { expect } from "@playwright/test";
import {
  navigateToAccountCategories,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
} from "../utils/helpers/navigation";

/**
 * Category + group CRUD, replacing the legacy account-category /
 * transaction-category / transaction-group specs. All three screens are
 * MyTab-backed entity lists (same `edit-btn-<id>` / `delete-btn-<id>` action
 * row), reached via `SecondaryTabBar` sub-tabs. Their delete flows have
 * `allowDeleteDependencies: false`, but freshly created entities have no
 * dependents so the confirm button is enabled immediately.
 */
test.describe("account categories", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await navigateToAccountCategories(page);
  });

  test("creates an account category", async ({ page }) => {
    const name = `Acct Cat ${Date.now()}`;
    await createAccountCategory(page, { name });
    await expect(listItem(page, name)).toBeVisible();
  });

  test("edits an account category name", async ({ page }) => {
    const stamp = Date.now();
    const name = `AcctCat ${stamp}`;
    await createAccountCategory(page, { name });
    const id = await getItemId(page, name);

    const updated = `Renamed ${stamp}`;
    await openEditFormById(page, id);
    await page.getByTestId("accountcategory-name").fill(updated);
    await page.getByTestId("accountcategory-save").click();
    await waitForOverlayClosed(page);

    await expect(listItem(page, updated)).toBeVisible();
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });

  test("deletes an account category", async ({ page }) => {
    const name = `Del Cat ${Date.now()}`;
    await createAccountCategory(page, { name });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });
});

test.describe("transaction groups", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await navigateToTransactionGroups(page);
  });

  test("creates a transaction group", async ({ page }) => {
    const name = `Group ${Date.now()}`;
    await createTransactionGroup(page, { name });
    await expect(listItem(page, name)).toBeVisible();
  });

  test("deletes a transaction group", async ({ page }) => {
    const name = `Del Group ${Date.now()}`;
    await createTransactionGroup(page, { name });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });
});

test.describe("transaction categories", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await navigateToTransactionCategories(page);
  });

  test("creates a transaction category under a group", async ({ page }) => {
    const name = `Txn Cat ${Date.now()}`;
    await createTransactionCategory(page, { name });
    await expect(listItem(page, name)).toBeVisible();
  });

  test("deletes a transaction category", async ({ page }) => {
    const name = `Del Txn Cat ${Date.now()}`;
    await createTransactionCategory(page, { name });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });
});
