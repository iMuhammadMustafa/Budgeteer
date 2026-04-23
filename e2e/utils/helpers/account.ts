import { expect, Page } from "@playwright/test";
import { fillAccountForm, fillCategoryForm } from "./fill-forms";
import { openMyTabAddModal, saveForm } from "./modal";

// ============================================
// ACCOUNT CREATION
// ============================================

export async function createAccount(
  page: Page,
  options: {
    name?: string;
    categoryName: string;
    balance?: string;
    owner?: string;
  },
): Promise<string> {
  const name = options.name || `Test Account ${Date.now()}`;
  await openMyTabAddModal(page, "Account");
  await fillAccountForm(page, {
    name,
    categoryName: options.categoryName,
    balance: options.balance || "0",
    owner: options.owner,
  });
  await saveForm(page);
  const accountItem = page.getByTestId(/^list-item-/).filter({ hasText: name });
  await expect(accountItem).toBeVisible({ timeout: 15000 });
  return name;
}

export async function createCategory(
  page: Page,
  options: {
    name?: string;
    type?: "Asset" | "Liability";
    displayOrder?: string;
  } = {},
): Promise<string> {
  const name = options.name || `Test Category ${Date.now()}`;
  await openMyTabAddModal(page, "Account Category");
  await fillCategoryForm(page, {
    name,
    type: options.type || "Asset",
    displayOrder: options.displayOrder || "9999",
  });
  await saveForm(page);
  const categoryItem = page.getByTestId(/^list-item-/).filter({ hasText: name });
  await expect(categoryItem).toBeVisible({ timeout: 15000 });
  return name;
}

// ============================================
// ACCOUNT BALANCE HELPERS
// ============================================

export async function getAccountBalance(page: Page, accountName: string): Promise<number> {
  const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
  await expect(accountRow).toBeVisible();
  const balanceText = await accountRow.textContent();
  // Extract balance from text (format: "Account Name$1,000.00")
  const match = balanceText?.match(/\$[\d,]+\.\d{2}/);
  const balanceStr = match ? match[0] : "$0.00";
  return parseFloat(balanceStr.replace(/[$,]/g, ""));
}

export async function getAccountBalanceText(page: Page, accountName: string): Promise<string> {
  const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
  const balanceText = await accountRow.textContent();
  const match = balanceText?.match(/\$[\d,]+\.\d{2}/);
  return match ? match[0] : "$0.00";
}

export function parseBalance(balanceText: string): number {
  return parseFloat(balanceText.replace(/[$,]/g, ""));
}

export async function verifyAccountBalance(page: Page, accountName: string, expectedBalance: string) {
  const accountRow = page.getByTestId(/^list-item-/).filter({ hasText: accountName });
  await expect(accountRow).toBeVisible();
  await expect(accountRow).toContainText(expectedBalance);
}
