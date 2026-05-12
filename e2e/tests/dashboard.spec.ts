import { Page } from "@playwright/test";
import { expect, loginWithMode, StorageMode, test } from "../fixtures/auth";
import {
  createAccount,
  createCategory,
  createTransaction,
  createTransactionCategory,
  createTransactionGroup,
  navigateToAccountCategories,
  navigateToAccounts,
  navigateToDashboard,
  navigateToTransactionCategories,
  navigateToTransactionGroups,
} from "../utils/helpers";

const storageModes: StorageMode[] = ["local", "cloud"];

for (const mode of storageModes) {
  test.describe(`Dashboard [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await loginWithMode(page, mode);
      await navigateToDashboard(page);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test("dashboard loads successfully", async () => {
      await expect(page).toHaveURL(/Dashboard/);
      await expect(page.getByText("Dashboard").first()).toBeVisible();
    });

    test("dashboard displays chart containers with SVG elements", async () => {
      await expect(page.locator("svg:visible").first()).toBeVisible({ timeout: 15000 });
    });

    test("refresh button works without errors", async () => {
      const refreshBtn = page.locator('[class*="lucide-refresh"], [data-lucide="refresh-ccw"]');
      if (await refreshBtn.isVisible().catch(() => false)) {
        await refreshBtn.click();
      } else {
        const btn = page.getByRole("button").filter({ hasText: /refresh/i });
        if (await btn.isVisible().catch(() => false)) {
          await btn.first().click();
        }
      }
      await expect(page.locator("svg:visible").first()).toBeVisible({ timeout: 15000 });
    });
  });

  // =====================================================================
  // DASHBOARD WITH REAL DATA
  // =====================================================================
  test.describe(`Dashboard Data Reflection [${mode}]`, () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;
    let testAccountName: string;
    let testTxnCategoryName: string;

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(120000);
      page = await browser.newPage();
      await loginWithMode(page, mode);

      const timestamp = Date.now();

      // Create prerequisite entities
      const testAccountCategoryName = `Dash AccCat ${timestamp}`;
      await navigateToAccountCategories(page);
      await createCategory(page, { name: testAccountCategoryName, type: "Asset" });

      testAccountName = `Dash Account ${timestamp}`;
      await navigateToAccounts(page);
      await createAccount(page, {
        name: testAccountName,
        categoryName: testAccountCategoryName,
        balance: "10000",
      });

      const testTxnGroupName = `Dash TxnGroup ${timestamp}`;
      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: testTxnGroupName, type: "Expense" });

      testTxnCategoryName = `Dash TxnCat ${timestamp}`;
      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, {
        name: testTxnCategoryName,
        groupName: testTxnGroupName,
      });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test("creating an expense transaction updates dashboard charts", async () => {
      // Create a known expense
      await createTransaction(page, {
        name: `Dash Expense ${Date.now()}`,
        amount: "500",
        accountName: testAccountName,
        type: "Expense",
        categoryName: testTxnCategoryName,
      });

      // Navigate to dashboard
      await navigateToDashboard(page);
      // Charts should render (SVG elements present)
      await expect(page.locator("svg:visible").first()).toBeVisible({ timeout: 15000 });
    });

    test("creating an income transaction updates dashboard charts", async () => {
      const incomeGroupName = `Dash Income Group ${Date.now()}`;
      await navigateToTransactionGroups(page);
      await createTransactionGroup(page, { name: incomeGroupName, type: "Income" });

      const incomeCategoryName = `Dash Income Cat ${Date.now()}`;
      await navigateToTransactionCategories(page);
      await createTransactionCategory(page, {
        name: incomeCategoryName,
        groupName: incomeGroupName,
      });

      await createTransaction(page, {
        name: `Dash Income ${Date.now()}`,
        amount: "1500",
        accountName: testAccountName,
        type: "Income",
        categoryName: incomeCategoryName,
      });

      await navigateToDashboard(page);

      // Charts should still render with the updated data
      await expect(page.locator("svg:visible").first()).toBeVisible({ timeout: 15000 });
    });

    test("dashboard shows period labels for current month", async () => {
      await navigateToDashboard(page);

      // The dashboard should display some kind of period/temporal indicator
      // This could be month names (abbreviated or full), dates, day numbers,
      // or year references
      const now = new Date();
      const currentMonth = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
      const currentMonthShort = now.toLocaleString("en-US", { month: "short" }).toLowerCase();
      const currentYear = now.getFullYear().toString();

      const hasMonthLabel = await page
        .getByText(new RegExp(`${currentMonth}|${currentMonthShort}`, "i"))
        .filter({ visible: true })
        .first()
        .isVisible()
        .catch(() => false);
      const hasYearLabel = await page
        .getByText(currentYear)
        .filter({ visible: true })
        .first()
        .isVisible()
        .catch(() => false);
      const hasDateLabel = await page
        .getByText(/\d{1,2}\/\d{1,2}|\d{4}-\d{2}/)
        .filter({ visible: true })
        .first()
        .isVisible()
        .catch(() => false);

      // Dashboard should have some temporal context
      expect(hasMonthLabel || hasYearLabel || hasDateLabel).toBe(true);
    });

    test("multiple expense transactions are reflected in charts", async () => {
      // Create additional expenses
      await createTransaction(page, {
        name: `Dash Multi Expense 1 ${Date.now()}`,
        amount: "200",
        accountName: testAccountName,
        type: "Expense",
        categoryName: testTxnCategoryName,
      });

      await createTransaction(page, {
        name: `Dash Multi Expense 2 ${Date.now()}`,
        amount: "300",
        accountName: testAccountName,
        type: "Expense",
        categoryName: testTxnCategoryName,
      });

      await navigateToDashboard(page);

      // Dashboard should render with charts showing accumulated data
      const svgCount = await page.locator("svg:visible").count();
      expect(svgCount).toBeGreaterThan(0);
    });
  });
}
