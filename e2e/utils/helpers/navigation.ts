import { Page } from "@playwright/test";

// ============================================
// FAST NAVIGATION HELPERS (page.goto)
// ============================================

async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToAccountCategories(page: Page) {
  await navigateTo(page, "/Accounts/Categories");
}

export async function navigateToRestoreAccountCategories(page: Page) {
  await navigateTo(page, "/Restore/AccountCategories");
}

export async function navigateToTransactionGroups(page: Page) {
  await navigateTo(page, "/Categories/Groups");
}

export async function navigateToRestoreTransactionGroups(page: Page) {
  await navigateTo(page, "/Restore/TransactionGroups");
}

export async function navigateToAccounts(page: Page) {
  await navigateTo(page, "/Accounts");
}

export async function navigateToRestoreAccounts(page: Page) {
  await navigateTo(page, "/Restore/Accounts");
}

export async function navigateToTransactionCategories(page: Page) {
  await navigateTo(page, "/Categories");
}

export async function navigateToRestoreTransactionCategories(page: Page) {
  await navigateTo(page, "/Restore/TransactionCategories");
}

export async function navigateToTransactions(page: Page) {
  await navigateTo(page, "/Transactions");
}

export async function navigateToRestoreTransactions(page: Page) {
  await navigateTo(page, "/Restore/Transactions");
}

export async function navigateToDashboard(page: Page) {
  await navigateTo(page, "/Dashboard");
}

export async function navigateToSettings(page: Page) {
  await navigateTo(page, "/Settings");
}

// ============================================
// DIRECT / SHORTCUT NAVIGATION (aliases)
// ============================================

export async function navigateToAccountsViaDrawer(page: Page) {
  await navigateToAccounts(page);
}

export async function navigateToTransactionsViaDrawer(page: Page) {
  await navigateToTransactions(page);
}

export async function navigateToAddTransaction(page: Page) {
  await navigateTo(page, "/AddTransaction");
}

export async function navigateToSummary(page: Page) {
  await navigateTo(page, "/Summary");
}
