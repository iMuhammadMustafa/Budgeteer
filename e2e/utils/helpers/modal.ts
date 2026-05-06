import { expect, Page } from "@playwright/test";
import { selectors } from "../selectors";

// ============================================
// MODAL OPEN HELPERS
// ============================================

export async function openMyTabAddModal(page: Page, heading?: string) {
  await page.getByTestId(selectors.myTab.addButton).filter({ visible: true }).first().click();
  await page.waitForSelector(selectors.ui.modal);
  if (heading) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
}

export async function openMyTabEditModal(page: Page, itemName: string, heading?: string) {
  const listItem = page.getByTestId(/^list-item-/).filter({ hasText: itemName });
  await expect(listItem).toBeVisible();
  await listItem.click();
  const modal = page.locator(selectors.ui.modal);
  await modal.waitFor({ state: "visible" });
  await expect(modal).toBeVisible();
  if (heading) {
    await expect(modal.getByRole("heading", { name: heading })).toBeVisible();
  }
  return modal;
}

export async function openMyTabRestoreModal(page: Page, itemText: string) {
  const listItem = page.getByTestId(/^list-item-/).filter({ hasText: itemText });
  await expect(listItem).toBeVisible();
  await listItem.getByTestId(selectors.myTab.restoreButton).click();
}

export async function openTransactionEditModal(page: Page, transactionName: string) {
  const transactionLink = page
    .getByRole("link")
    .filter({ has: page.getByText(transactionName, { exact: true }) })
    .first();

  await expect(transactionLink).toBeVisible();
  await transactionLink.click();

  const form = page.getByRole("list", { name: "Form container" });
  await expect(form).toBeVisible();
  await expect(form.getByRole("button", { name: /save transaction/i })).toBeVisible();
  await expect(form.getByPlaceholder("Type to search..")).toHaveValue(transactionName);

  return form;
}

// ============================================
// MODAL ACTION HELPERS
// ============================================

export async function closeModal(page: Page, heading?: string) {
  await page.keyboard.press("Escape");
  if (heading) {
    await expect(page.getByRole("heading", { name: heading })).not.toBeVisible();
  }
}

export async function confirmAction(page: Page, buttonPattern: RegExp = /confirm|restore|delete|yes/i) {
  await page.waitForSelector(selectors.ui.modal);
  await page.getByRole("button", { name: buttonPattern }).click();
}

export async function saveForm(page: Page) {
  const modal = page.locator(selectors.ui.modal).last();
  const modalSaveButton = modal.getByRole("button", { name: /save|submit/i }).first();

  if (await modalSaveButton.isVisible().catch(() => false)) {
    await expect(modalSaveButton).toBeEnabled();
    await modalSaveButton.click({ timeout: 10000 }).catch(async () => {
      // Retry with force if click is intercepted (e.g., by dropdown overlay)
      await modalSaveButton.click({ force: true });
    });
    await expect(modal).not.toBeVisible({ timeout: 10000 }).catch(() => {});
  } else {
    const pageSaveButton = page.getByRole("button", { name: /save|submit/i }).filter({ visible: true }).first();
    await expect(pageSaveButton).toBeEnabled();
    await pageSaveButton.click({ timeout: 10000 }).catch(async () => {
      await pageSaveButton.click({ force: true });
    });
  }

  await page.waitForLoadState("domcontentloaded").catch(() => {});
}
