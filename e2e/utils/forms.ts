import { expect, Page } from "@playwright/test";

/**
 * Redesign-matched (Sage Paper) form helpers.
 *
 * The redesigned create/edit forms render inside an overlay marked
 * `data-testid="dialog"` (not `role="dialog"`) and use test-id'd fields plus
 * quick-pick "pills" for category/icon/color rather than searchable dropdowns.
 * These helpers target those stable test ids and use web-first assertions only.
 */

export const overlay = (page: Page) => page.getByTestId("dialog");

/**
 * An entity-list row container by its visible text. The list renders three
 * nested nodes per item (`list-item-<id>`, `-press`, `-row`); this anchors to
 * the container id (uuid = hex + hyphens only) so the match is unambiguous.
 */
export const listItem = (page: Page, name: string) =>
  page.getByTestId(/^list-item-[0-9a-f-]+$/).filter({ hasText: name });

/** Wait for the create/edit overlay to be present, then gone. */
export async function waitForOverlayOpen(page: Page) {
  await expect(overlay(page)).toBeVisible();
}
export async function waitForOverlayClosed(page: Page) {
  await expect(overlay(page)).toBeHidden();
}

/** Open the "add" form on an entity-list screen (Accounts, Categories, …). */
export async function openAddForm(page: Page) {
  await page.getByTestId("add-btn").filter({ visible: true }).first().click();
  await waitForOverlayOpen(page);
}

/**
 * Create an account via the redesigned form.
 * `categoryName` must be one of the quick-pick pills (Cash, Credit Card,
 * Debit Card, Gift Card, Loan) or is resolved via "View all".
 */
export async function createAccount(
  page: Page,
  opts: { name: string; categoryName?: string; balance?: string },
): Promise<string> {
  await openAddForm(page);

  await page.getByTestId("account-name").fill(opts.name);

  if (opts.categoryName) {
    const pill = page.getByRole("button", { name: opts.categoryName, exact: true });
    if (await pill.count()) {
      await pill.first().click();
    } else {
      await page.getByTestId("account-category-view-all").click();
      await page.getByRole("button", { name: opts.categoryName, exact: true }).first().click();
    }
  }

  if (opts.balance) {
    await page.getByTestId("account-balance").fill(opts.balance);
  }

  await page.getByTestId("account-save").click();
  await waitForOverlayClosed(page);

  await expect(listItem(page, opts.name)).toBeVisible();
  return opts.name;
}

/**
 * Generic entity-list actions (`src/components/ui/entity-list/*`): every
 * MyTab-backed screen (Accounts, Account Categories, Transaction Categories,
 * Groups, Restore/*) renders the same `edit-btn-<id>` / `delete-btn-<id>` /
 * `restore-btn-<id>` action row and `list-item-<id>` row testids, so these
 * helpers work across all of them.
 */

/** Resolve a list row's entity id from its `list-item-<uuid>` testid. */
export async function getItemId(page: Page, name: string): Promise<string> {
  const testId = await listItem(page, name).getAttribute("data-testid");
  const match = testId?.match(/^list-item-([0-9a-f-]+)$/);
  if (!match) throw new Error(`Could not resolve entity id for list item "${name}"`);
  return match[1];
}

/** Open the inline edit form (UpsertModal) for a list row by entity id. */
export async function openEditFormById(page: Page, id: string) {
  await page.getByTestId(`edit-btn-${id}`).click();
  await waitForOverlayOpen(page);
}

/**
 * Delete a list row by entity id via the shared DeleteConfirmModal.
 * Scoped to the overlay — other rows' `delete-btn-<id>` icon buttons also
 * carry the accessible name "Delete", so a page-wide role lookup would be
 * ambiguous.
 *
 * When the entity has dependents (e.g. an account's opening transaction), the
 * modal disables the confirm button until either a replacement is chosen or
 * "Also delete all …" is toggled. This helper opts into cascade-delete when
 * that affordance is present so it works for both dependency-free and
 * dependency-bearing entities.
 */
export async function deleteItemById(page: Page, id: string) {
  await page.getByTestId(`delete-btn-${id}`).click();
  await waitForOverlayOpen(page);
  const cascade = overlay(page).getByRole("button", { name: /Also delete all/ });
  if (await cascade.count()) {
    await cascade.first().click();
  }
  await overlay(page)
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await waitForOverlayClosed(page);
}

/** Restore a soft-deleted list row by entity id via ConfirmRestoreModal. */
export async function restoreItemById(page: Page, id: string) {
  await page.getByTestId(`restore-btn-${id}`).click();
  await waitForOverlayOpen(page);
  await overlay(page)
    .getByRole("button", { name: /^Restore/ })
    .click();
  await waitForOverlayClosed(page);
}

/** Pick an option from a `ui/Select`-backed dropdown by its testID + option id. */
export async function selectDropdownOption(page: Page, dropdownTestId: string, optionId: string) {
  await page.getByTestId(dropdownTestId).click();
  await page.getByTestId(`${dropdownTestId}-option-${optionId}`).click();
}

/**
 * Create an account category (`AccountCategoryForm`). Only `name` is required —
 * type defaults to "Asset" and icon/color have defaults.
 */
export async function createAccountCategory(page: Page, opts: { name: string }): Promise<string> {
  await openAddForm(page);
  await page.getByTestId("accountcategory-name").fill(opts.name);
  await page.getByTestId("accountcategory-save").click();
  await waitForOverlayClosed(page);
  await expect(listItem(page, opts.name)).toBeVisible();
  return opts.name;
}

/** Create a transaction group (`TransactionGroupForm`). Only `name` is required. */
export async function createTransactionGroup(page: Page, opts: { name: string }): Promise<string> {
  await openAddForm(page);
  await page.getByTestId("group-name").fill(opts.name);
  await page.getByTestId("group-save").click();
  await waitForOverlayClosed(page);
  await expect(listItem(page, opts.name)).toBeVisible();
  return opts.name;
}

/**
 * Create a transaction category (`TransactionCategoryForm`). Requires name +
 * group + icon + color; icon/color default. The group is a required QuickPills
 * pick — we select the first available group pill (any valid group satisfies
 * validation; the specific group is irrelevant to a create journey).
 */
export async function createTransactionCategory(page: Page, opts: { name: string }): Promise<string> {
  await openAddForm(page);
  await page.getByTestId("transactioncategory-name").fill(opts.name);
  await page.getByTestId(/^transactioncategory-group-pill-/).first().click();
  await page.getByTestId("transactioncategory-save").click();
  await waitForOverlayClosed(page);
  await expect(listItem(page, opts.name)).toBeVisible();
  return opts.name;
}

/** A transaction row on the Transactions list, matched by its visible name. */
export const transactionRow = (page: Page, name: string) =>
  page.getByTestId(/^transaction-item-/).filter({ hasText: name });

/**
 * Long-press a transaction row to enter selection mode and select it. A plain
 * click with a delay is how RNW surfaces a long-press on web.
 */
export async function selectTransaction(page: Page, name: string) {
  await transactionRow(page, name).first().click({ delay: 700 });
}

/**
 * Batch-delete the currently-selected transaction(s) via the selection header
 * (`btn-delete-selected`) + the shared confirm dialog.
 */
export async function deleteSelectedTransactions(page: Page) {
  await page.getByTestId("btn-delete-selected").click();
  await waitForOverlayOpen(page);
  await overlay(page).getByRole("button", { name: "Delete", exact: true }).click();
  await waitForOverlayClosed(page);
}

/**
 * Void / unvoid the currently-selected transaction(s) via the BatchUpdateModal.
 * Enables the "Update Void Status" option, sets the switch to match `shouldVoid`
 * (the switch defaults to Active=false, so only toggle when voiding), applies,
 * and confirms through the BatchActionConfirmModal ("Update").
 */
export async function setSelectedVoid(page: Page, shouldVoid: boolean) {
  await page.getByTestId("btn-batch-update").click();
  await waitForOverlayOpen(page);
  await page.getByTestId("btn-toggle-update-void-status").click();
  if (shouldVoid) {
    await page.getByTestId("switch-void-status").click();
  }
  await overlay(page).getByRole("button", { name: "Apply Updates" }).click();
  // The apply hands off to the BatchActionConfirmModal; confirm with "Update".
  await waitForOverlayOpen(page);
  await overlay(page).getByRole("button", { name: "Update", exact: true }).click();
  await waitForOverlayClosed(page);
}

/**
 * Delete a list row that has dependents by *reassigning* them to another entity
 * (rather than cascade-deleting). Opens the DeleteConfirmModal, picks the
 * replacement from its `select` dropdown, and confirms. Used for the
 * delete-account-and-move-transactions journey.
 */
export async function deleteItemReassigning(page: Page, id: string, replacementId: string) {
  await page.getByTestId(`delete-btn-${id}`).click();
  await waitForOverlayOpen(page);
  await selectDropdownOption(page, "select", replacementId);
  await overlay(page).getByRole("button", { name: "Delete", exact: true }).click();
  await waitForOverlayClosed(page);
}

/**
 * Fill and submit the redesigned TransactionForm (`/AddTransaction`). Assumes
 * the caller has already navigated there. On wide web (the desktop project) the
 * amount is a plain text `field-amount-input` (the on-screen keypad is hidden
 * ≥768px). Category + account are picked by their visible label from the
 * option lists. On submit the form resets and routes to `/Transactions`.
 */
export async function fillTransactionForm(
  page: Page,
  opts: {
    type?: "Expense" | "Income" | "Transfer";
    amount: string;
    categoryName?: string;
    accountName: string;
    transferAccountName?: string;
    name?: string;
  },
) {
  const { type = "Expense", amount, categoryName, accountName, transferAccountName } = opts;
  // `name` is a required field with no auto-fill, so always set one.
  const name = opts.name ?? `E2E ${type} ${amount}`;

  if (type !== "Expense") {
    await page.getByTestId(`transaction-type-${type}`).click();
  }

  await page.getByTestId("field-amount-input").fill(amount);

  // Name — a free-text SearchableSelect (default testID). Open, type, commit.
  await page.getByTestId("searchable-select").click();
  await page.getByTestId("searchable-select-search").fill(name);
  await page.getByTestId("searchable-select-commit-text").click();

  if (categoryName) {
    await page.getByTestId("field-categoryid").click();
    await page
      .locator('[data-testid^="field-categoryid-option-"]')
      .filter({ hasText: categoryName })
      .first()
      .click();
  }

  await page.getByTestId("field-accountid").click();
  await page
    .locator('[data-testid^="field-accountid-option-"]')
    .filter({ hasText: accountName })
    .first()
    .click();

  if (type === "Transfer" && transferAccountName) {
    await page.getByTestId("field-transferaccountid").click();
    await page
      .locator('[data-testid^="field-transferaccountid-option-"]')
      .filter({ hasText: transferAccountName })
      .first()
      .click();
  }

  await page.getByTestId("btn-form-submit").click();
  await page.waitForURL(/\/Transactions/);
}
