import { gotoApp, test } from "../fixtures/app";
import {
  createAccountCategory,
  createTransactionCategory,
  createTransactionGroup,
  deleteItemById,
  getItemId,
  listItem,
  openEditFormById,
  restoreItemById,
  waitForOverlayClosed,
} from "../utils/forms";
import { expect } from "@playwright/test";
import {
  navigateToAccountCategories,
  navigateToRestoreAccountCategories,
  navigateToRestoreTransactionCategories,
  navigateToRestoreTransactionGroups,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
} from "../utils/helpers/navigation";

/**
 * Category + group CRUD, replacing the legacy account-category /
 * transaction-category / transaction-group specs. All three screens are
 * MyTab-backed entity lists (same `edit-btn-<id>` / `delete-btn-<id>` /
 * `restore-btn-<id>` action row), reached via `SecondaryTabBar` sub-tabs. Their
 * delete flows have `allowDeleteDependencies: false`, but freshly created
 * entities have no dependents so the confirm button is enabled immediately.
 *
 * Parity with the legacy specs: create/edit/delete plus soft-delete → restore
 * round-trips for all three entities.
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

  test("restores a soft-deleted account category", async ({ page }) => {
    const name = `Restorable Cat ${Date.now()}`;
    await createAccountCategory(page, { name });
    const id = await getItemId(page, name);
    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToRestoreAccountCategories(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
    await restoreItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToAccountCategories(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
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

  test("edits a transaction group name", async ({ page }) => {
    const stamp = Date.now();
    const name = `Grp ${stamp}`;
    await createTransactionGroup(page, { name });
    const id = await getItemId(page, name);

    // Distinct (non-superstring) name so the `hasText` row match can't still
    // match the old name after the rename.
    const updated = `Renamed ${stamp}`;
    await openEditFormById(page, id);
    await page.getByTestId("group-name").fill(updated);
    await page.getByTestId("group-save").click();
    await waitForOverlayClosed(page);

    await expect(listItem(page, updated)).toBeVisible();
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });

  test("deletes a transaction group", async ({ page }) => {
    const name = `Del Group ${Date.now()}`;
    await createTransactionGroup(page, { name });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });

  test("restores a soft-deleted transaction group", async ({ page }) => {
    const name = `Restorable Group ${Date.now()}`;
    await createTransactionGroup(page, { name });
    const id = await getItemId(page, name);
    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToRestoreTransactionGroups(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
    await restoreItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToTransactionGroups(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
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

  test("edits a transaction category name", async ({ page }) => {
    const stamp = Date.now();
    const name = `TxnCat ${stamp}`;
    await createTransactionCategory(page, { name });
    const id = await getItemId(page, name);

    // Distinct (non-superstring) name — see the group-edit note above.
    const updated = `Renamed ${stamp}`;
    await openEditFormById(page, id);
    await page.getByTestId("transactioncategory-name").fill(updated);
    await page.getByTestId("transactioncategory-save").click();
    await waitForOverlayClosed(page);

    await expect(listItem(page, updated)).toBeVisible();
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });

  test("deletes a transaction category", async ({ page }) => {
    const name = `Del Txn Cat ${Date.now()}`;
    await createTransactionCategory(page, { name });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });

  test("restores a soft-deleted transaction category", async ({ page }) => {
    const name = `Restorable TxnCat ${Date.now()}`;
    await createTransactionCategory(page, { name });
    const id = await getItemId(page, name);
    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToRestoreTransactionCategories(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
    await restoreItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToTransactionCategories(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
  });
});
