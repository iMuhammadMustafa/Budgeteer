import { gotoApp, test } from "../fixtures/app";
import {
  createAccount,
  deleteItemById,
  fillTransactionForm,
  getItemId,
  listItem,
  openEditFormById,
  overlay,
  restoreItemById,
  selectDropdownOption,
  waitForOverlayClosed,
  waitForOverlayOpen,
} from "../utils/forms";
import { expect } from "@playwright/test";
import {
  navigateToAccounts,
  navigateToAddTransaction,
  navigateToRestoreAccounts,
} from "../utils/helpers/navigation";

/**
 * Accounts journeys beyond plain create (covered by smoke.spec.ts): edit,
 * delete, restore, transfer and balance-adjustment. Redesign-matched:
 * list-level actions are `edit-btn-<id>` / `delete-btn-<id>` /
 * `transfer-btn-<id>` (see `EntityListItem` + `Accounts/index.tsx`); balance
 * adjustment only lives on the account detail page (`/Accounts/<id>`).
 */
test.describe("accounts CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await navigateToAccounts(page);
  });

  test("edits an account's name", async ({ page }) => {
    const stamp = Date.now();
    const original = `Editable ${stamp}`;
    await createAccount(page, { name: original, categoryName: "Cash" });
    const id = await getItemId(page, original);

    // Distinct (non-superstring) name so the `hasText` row match can't still
    // match the old name after the rename.
    const updated = `Renamed ${stamp}`;
    await openEditFormById(page, id);
    await page.getByTestId("account-name").fill(updated);
    await page.getByTestId("account-save").click();
    await waitForOverlayClosed(page);

    await expect(listItem(page, updated)).toBeVisible();
    await expect(listItem(page, original)).toHaveCount(0);
  });

  test("deletes an account", async ({ page }) => {
    const name = `Delete Me ${Date.now()}`;
    await createAccount(page, { name, categoryName: "Cash" });
    const id = await getItemId(page, name);

    await deleteItemById(page, id);

    await expect(listItem(page, name)).toHaveCount(0);
  });

  test("restores a deleted account", async ({ page }) => {
    const name = `Restore Me ${Date.now()}`;
    await createAccount(page, { name, categoryName: "Cash" });
    const id = await getItemId(page, name);
    await deleteItemById(page, id);
    await expect(listItem(page, name)).toHaveCount(0);

    await navigateToRestoreAccounts(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
    await restoreItemById(page, id);
    // Gone from the Restore (deleted) list. Scope to visible: the drawer keeps
    // sibling screens mounted, so a hidden duplicate row can linger in the DOM.
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);

    await navigateToAccounts(page);
    await expect(listItem(page, name).filter({ visible: true })).toBeVisible();
  });

  test("transfers funds between two accounts", async ({ page }) => {
    const sourceName = `Transfer Source ${Date.now()}`;
    const targetName = `Transfer Target ${Date.now()}`;
    await createAccount(page, { name: sourceName, categoryName: "Cash", balance: "500" });
    await createAccount(page, { name: targetName, categoryName: "Cash", balance: "100" });
    const sourceId = await getItemId(page, sourceName);
    const targetId = await getItemId(page, targetName);

    await page.getByTestId(`transfer-btn-${targetId}`).click();
    await waitForOverlayOpen(page);
    await page.getByTestId("transfer-amount-input").fill("50");
    await selectDropdownOption(page, "dropdown-account", sourceId);
    await page.getByTestId("transfer-submit-btn").click();
    await waitForOverlayClosed(page);

    await expect(listItem(page, sourceName)).toContainText("$450.00");
    await expect(listItem(page, targetName)).toContainText("$150.00");
  });

  test("adjusts an account's balance from the detail page", async ({ page }) => {
    const name = `Adjust Me ${Date.now()}`;
    await createAccount(page, { name, categoryName: "Cash", balance: "200" });

    await listItem(page, name).click();
    await page.waitForURL(/\/Accounts\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: "Adjust balance" }).click();
    await expect(overlay(page)).toBeVisible();
    await page.getByTestId("adjust-balance-input").fill("300");
    await page.getByTestId("adjust-submit-btn").click();
    await expect(overlay(page)).toBeHidden();

    // Verify via the Accounts list row (the detail page renders a hidden
    // responsive duplicate of the balance, which makes a bare text match flaky).
    await navigateToAccounts(page);
    await expect(listItem(page, name)).toContainText("$300.00");
  });

  test("changes an account's category", async ({ page }) => {
    const name = `Recategorize ${Date.now()}`;
    // Created under "Cash"; the detail page shows the current category name.
    await createAccount(page, { name, categoryName: "Cash" });
    const id = await getItemId(page, name);

    await openEditFormById(page, id);
    // Pick a different seeded category pill and save.
    await page.getByRole("button", { name: "Credit Card", exact: true }).first().click();
    await page.getByTestId("account-save").click();
    await waitForOverlayClosed(page);

    // The detail page renders the account's category label — confirm it changed.
    await listItem(page, name).click();
    await page.waitForURL(/\/Accounts\/[0-9a-f-]+$/);
    await expect(page.getByText("Credit Card", { exact: true }).first()).toBeVisible();
  });

  test("total account balance sums newly created accounts", async ({ page }) => {
    // Local mode seeds no accounts, so the running total starts at $0.00. Two
    // accounts whose individual balances ($300 + $442) don't equal the total
    // ($742) mean the footer total is the *only* place "$742.00" can appear.
    const stamp = Date.now();
    await createAccount(page, { name: `Totals A ${stamp}`, categoryName: "Cash", balance: "300" });
    await createAccount(page, { name: `Totals B ${stamp}`, categoryName: "Cash", balance: "442" });

    await expect(page.getByText("Total Account Balance:")).toBeVisible();
    await expect(page.getByText("$742.00").filter({ visible: true }).first()).toBeVisible();
  });

  test("deleting an account with transactions surfaces the dependency modal", async ({ page }) => {
    const name = `Depended On ${Date.now()}`;
    await createAccount(page, { name, categoryName: "Cash", balance: "1000" });

    // Add a transaction so the account has >1 dependent (opening txn + this one).
    await navigateToAddTransaction(page);
    await fillTransactionForm(page, { type: "Expense", amount: "50", categoryName: "Fuel", accountName: name });

    await navigateToAccounts(page);
    const id = await getItemId(page, name);

    // Opening the delete modal reveals the dependency notice + cascade option.
    await page.getByTestId(`delete-btn-${id}`).click();
    await waitForOverlayOpen(page);
    await expect(overlay(page).getByText(/associated Transactions/)).toBeVisible();
    await expect(overlay(page).getByRole("button", { name: /Also delete all/ })).toBeVisible();

    // Complete the cascade delete and confirm the account is gone.
    await overlay(page).getByRole("button", { name: /Also delete all/ }).click();
    await overlay(page).getByRole("button", { name: "Delete", exact: true }).click();
    await waitForOverlayClosed(page);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });
});
