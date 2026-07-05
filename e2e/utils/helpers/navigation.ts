import { Page } from "@playwright/test";

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

export async function navigateToSummary(page: Page) {
  await navigate(page, "Summary", /\/Summary/);
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
//
// Sub-screens are `SecondaryTabBar` (router mode) tabs — real `<Link asChild>`s,
// so on web each tab is an `<a>` (role "link", not "tab"; the inner testid is
// swallowed by the anchor). We scope the lookup to the tab-strip container
// (`testID="secondary-tabbar"`) so a same-named sidebar link can't collide.
//
// Tab topology (important — Account Categories is NOT under the Categories
// screen): Accounts screen → [Accounts, Categories(=Account Categories)];
// Categories screen → [Categories(=Transaction Categories), Groups].

/** Click a `SecondaryTabBar` tab by its label and wait for the route. */
async function clickTab(page: Page, tabName: string, urlPattern: RegExp): Promise<void> {
  await page
    .getByTestId("secondary-tabbar")
    .getByRole("link", { name: tabName, exact: true })
    .first()
    .click();
  await page.waitForURL(urlPattern);
}

/** Accounts screen → Account Categories tab (`/Accounts/Categories`). */
export async function navigateToAccountCategories(page: Page) {
  await navigateToAccounts(page);
  await clickTab(page, "Categories", /\/Accounts\/Categories/);
}

/** Categories screen → Transaction Groups tab (`/Categories/Groups`). */
export async function navigateToTransactionGroups(page: Page) {
  await navigateToCategories(page);
  await clickTab(page, "Groups", /\/Categories\/Groups/);
}

/**
 * Categories screen → Transaction Categories tab (`/Categories`).
 * The Categories index IS Transaction Categories, so landing there suffices.
 */
export async function navigateToTransactionCategories(page: Page) {
  await navigateToCategories(page);
  await clickTab(page, "Categories", /\/Categories$/);
}

// Restore sub-screens. `/Restore` auto-redirects to `/Restore/Accounts`; the
// explicit tab click makes the target unambiguous regardless of prior state.
export async function navigateToRestoreAccounts(page: Page) {
  await navigateToRestore(page);
  await clickTab(page, "Accounts", /\/Restore\/Accounts/);
}

export async function navigateToRestoreAccountCategories(page: Page) {
  await navigateToRestore(page);
  await clickTab(page, "Account Categories", /\/Restore\/AccountCategories/);
}

export async function navigateToRestoreTransactions(page: Page) {
  await navigateToRestore(page);
  await clickTab(page, "Transactions", /\/Restore\/Transactions/);
}

export async function navigateToRestoreTransactionGroups(page: Page) {
  await navigateToRestore(page);
  await clickTab(page, "Transaction Groups", /\/Restore\/TransactionGroups/);
}

export async function navigateToRestoreTransactionCategories(page: Page) {
  await navigateToRestore(page);
  await clickTab(page, "Transaction Categories", /\/Restore\/TransactionCategories/);
}

// Back-compat aliases used by legacy specs.
export const navigateToAccountsViaDrawer = navigateToAccounts;
export const navigateToTransactionsViaDrawer = navigateToTransactions;
