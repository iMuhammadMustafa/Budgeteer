import { Page } from "@playwright/test";

// ============================================
// FAST NAVIGATION HELPERS (page.goto)
// ============================================

export async function navigateToAccountCategories(page: Page) {
  await page.goto("/Accounts/Categories");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToRestoreAccountCategories(page: Page) {
  await page.goto("/Restore/AccountCategories");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToTransactionGroups(page: Page) {
  await page.goto("/Categories/Groups");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToRestoreTransactionGroups(page: Page) {
  await page.goto("/Restore/TransactionGroups");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToAccounts(page: Page) {
  await page.goto("/Accounts");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToRestoreAccounts(page: Page) {
  await page.goto("/Restore/Accounts");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToTransactionCategories(page: Page) {
  await page.goto("/Categories");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToRestoreTransactionCategories(page: Page) {
  await page.goto("/Restore/TransactionCategories");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToTransactions(page: Page) {
  await page.goto("/Transactions");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToRestoreTransactions(page: Page) {
  await page.goto("/Restore/Transactions");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToDashboard(page: Page) {
  await page.goto("/Dashboard");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToSettings(page: Page) {
  await page.goto("/Settings");
  await page.waitForLoadState("domcontentloaded");
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
  await page.goto("/AddTransaction");
  await page.waitForLoadState("domcontentloaded");
}

export async function navigateToSummary(page: Page) {
  await page.goto("/Summary");
  await page.waitForLoadState("domcontentloaded");
}
