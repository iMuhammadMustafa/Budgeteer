import { expect, Page } from "@playwright/test";

/**
 * Navigation helpers for the redesigned (Sage Paper) UI.
 *
 * On web the app renders a persistent sidebar of route links
 * (Dashboard, Transactions, New Transaction, Recurrings, Summary, Accounts,
 * Categories, Settings, Restore) — there is no hamburger "menu" button and no
 * bottom tab bar. Top-level navigation is a click on the visible sidebar link;
 * sub-screens (Categories → Groups, Restore → <entity>) are reached from their
 * landing screen's own tabs.
 *
 * All helpers assert arrival via URL — no time-based waits.
 */

/** Click a top-level sidebar link and wait for its route. */
export async function navigate(page: Page, linkName: string, urlPattern: RegExp): Promise<void> {
  await page.getByRole("link", { name: linkName, exact: true }).first().click();
  await page.waitForURL(urlPattern);
}

export async function navigateToDashboard(page: Page) {
  await navigate(page, "Dashboard", /\/Dashboard/);
}

export async function navigateToTransactions(page: Page) {
  await navigate(page, "Transactions", /\/Transactions/);
}

export async function navigateToAddTransaction(page: Page) {
  await navigate(page, "New Transaction", /\/AddTransaction/);
}

export async function navigateToAccounts(page: Page) {
  await navigate(page, "Accounts", /\/Accounts$/);
}

export async function navigateToCategories(page: Page) {
  await navigate(page, "Categories", /\/Categories/);
}

export async function navigateToSettings(page: Page) {
  await navigate(page, "Settings", /\/Settings/);
}

export async function navigateToRestore(page: Page) {
  await navigate(page, "Restore", /\/Restore/);
}

// ============================================
// SUB-SCREEN NAVIGATION (tabs within a landing screen)
// ============================================

/** Categories landing → Account Categories tab. */
export async function navigateToAccountCategories(page: Page) {
  await navigateToCategories(page);
  await page.getByRole("tab", { name: /account categor/i }).first().click();
  await expect(page).toHaveURL(/Categories/);
}

/** Categories landing → Transaction Groups tab. */
export async function navigateToTransactionGroups(page: Page) {
  await navigateToCategories(page);
  await page.getByRole("tab", { name: /groups/i }).first().click();
}

/** Categories landing → Transaction Categories tab. */
export async function navigateToTransactionCategories(page: Page) {
  await navigateToCategories(page);
  await page.getByRole("tab", { name: /categories/i }).first().click();
}

// Restore sub-screens
export async function navigateToRestoreAccounts(page: Page) {
  await navigateToRestore(page);
  await page.getByRole("tab", { name: /accounts/i }).first().click();
}

export async function navigateToRestoreAccountCategories(page: Page) {
  await navigateToRestore(page);
  await page.getByRole("tab", { name: /account categor/i }).first().click();
}

export async function navigateToRestoreTransactions(page: Page) {
  await navigateToRestore(page);
  await page.getByRole("tab", { name: /transactions/i }).first().click();
}

export async function navigateToRestoreTransactionGroups(page: Page) {
  await navigateToRestore(page);
  await page.getByRole("tab", { name: /groups/i }).first().click();
}

export async function navigateToRestoreTransactionCategories(page: Page) {
  await navigateToRestore(page);
  await page.getByRole("tab", { name: /transaction categor/i }).first().click();
}

// Back-compat aliases used by legacy specs.
export const navigateToAccountsViaDrawer = navigateToAccounts;
export const navigateToTransactionsViaDrawer = navigateToTransactions;
