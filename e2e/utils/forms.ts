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

/** Delete a list row by entity id via the shared DeleteConfirmModal. */
export async function deleteItemById(page: Page, id: string) {
  await page.getByTestId(`delete-btn-${id}`).click();
  await waitForOverlayOpen(page);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await waitForOverlayClosed(page);
}

/** Restore a soft-deleted list row by entity id via ConfirmRestoreModal. */
export async function restoreItemById(page: Page, id: string) {
  await page.getByTestId(`restore-btn-${id}`).click();
  await waitForOverlayOpen(page);
  await page.getByRole("button", { name: /^Restore/ }).click();
  await waitForOverlayClosed(page);
}

/** Pick an option from a `ui/Select`-backed dropdown by its testID + option id. */
export async function selectDropdownOption(page: Page, dropdownTestId: string, optionId: string) {
  await page.getByTestId(dropdownTestId).click();
  await page.getByTestId(`${dropdownTestId}-option-${optionId}`).click();
}
