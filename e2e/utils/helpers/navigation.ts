import { Page } from "@playwright/test";

// ============================================
// DRAWER / MENU NAVIGATION
// ============================================

export async function navigateToAccountCategories(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /accounts/i }).click();
  await page.getByLabel("Categories").first().click();
  await page.waitForURL("**/Categories");
}

export async function navigateToRestoreAccountCategories(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /restore/i }).click();
  await page.waitForURL("**/Restore/**");
  await page.waitForLoadState("domcontentloaded");
  await page.getByLabel("Account Categories").click();
  await page.waitForURL("**/Restore/AccountCategories");
}

export async function navigateToTransactionGroups(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /categories/i }).click();
  await page.getByLabel("Groups").first().click();
  await page.waitForURL("**/Categories/Groups");
}

export async function navigateToRestoreTransactionGroups(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /restore/i }).click();
  await page.waitForURL("**/Restore/**");
  await page.waitForLoadState("domcontentloaded");
  await page.getByLabel("Transaction Groups").click();
  await page.waitForURL("**/Restore/TransactionGroups");
}

export async function navigateToAccounts(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /accounts/i }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.getByLabel("Accounts").first().click();
  await page.waitForURL(/\/Accounts$/);
}

export async function navigateToRestoreAccounts(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /restore/i }).click();
  await page.waitForURL("**/Restore/**");
  await page.waitForLoadState("domcontentloaded");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // There are two "Accounts" buttons - drawer (first) and content tab (second)
  await page.getByRole("button", { name: "Accounts", exact: true }).nth(1).click();
  await page.waitForURL("**/Restore/Accounts");
}

export async function navigateToTransactionCategories(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /categories/i }).click();
  await page.getByTestId("tab-Categories").filter({ visible: true }).first().click();
  await page.waitForURL("**/Categories");
}

export async function navigateToRestoreTransactionCategories(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /restore/i }).click();
  await page.waitForURL("**/Restore/**");
  await page.waitForLoadState("domcontentloaded");
  await page.getByLabel("Transaction Categories").click();
  await page.waitForURL("**/Restore/TransactionCategories");
}

export async function navigateToTransactions(page: Page) {
  await page.getByText("Transactions", { exact: true }).click();
  await page.waitForURL("**/Transactions");
}

export async function navigateToRestoreTransactions(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /restore/i }).click();
  await page.waitForURL("**/Restore/**");
  await page.waitForLoadState("domcontentloaded");
  await page.getByLabel("Transactions").click();
  await page.waitForURL("**/Restore/Transactions");
}

export async function navigateToDashboard(page: Page) {
  await page.getByText("Dashboard", { exact: true }).click();
  await page.waitForURL("**/Dashboard");
}

export async function navigateToSettings(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.getByRole("button", { name: /settings/i }).click();
  await page.waitForURL("**/Settings");
}

// ============================================
// DIRECT / SHORTCUT NAVIGATION
// ============================================

export async function navigateToAccountsViaDrawer(page: Page) {
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /accounts/i }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.getByLabel("Accounts").first().click();
  await page.waitForURL(/\/Accounts$/);
}

export async function navigateToTransactionsViaDrawer(page: Page) {
  // Use direct navigation since bottom tabs may not be visible on all pages
  await page.goto("/Transactions");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Navigate to the AddTransaction page via direct URL.
 */
export async function navigateToAddTransaction(page: Page) {
  await page.goto("/AddTransaction");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
}
