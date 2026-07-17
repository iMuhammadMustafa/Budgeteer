import { awaitAppReady, expect, gotoApp, test } from "../fixtures/app";
import { createAccount, listItem } from "../utils/forms";
import { navigateToAccounts, navigateToDashboard, navigateToTransactions } from "../utils/helpers/navigation";

/**
 * @smoke — the fast, high-signal slice run on every PR and on the mobile
 * viewport. Uses the injection harness (no landing clicks, no hard waits) and a
 * fresh context per test. Runs in whichever project's mode is active
 * (local by default; cloud when creds are present).
 *
 * Local mode seeds account categories (Bank, Cash, Credit Card, …) and
 * transaction categories, so write journeys build on seeded data rather than
 * multi-step setup.
 */
test.describe("@smoke @mobile app entry", () => {
  test("landing page offers the three storage modes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Welcome (to|back)/)).toBeVisible();
    await expect(page.getByTestId("mode-local")).toBeVisible();
    await expect(page.getByTestId("mode-cloud")).toBeVisible();
    await expect(page.getByTestId("mode-demo")).toBeVisible();
    // Theme toggle is present on the landing shell.
    await expect(page.getByTestId("btn-theme-toggle").first()).toBeVisible();
  });

  test("choosing Cloud mode routes to the Login screen", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("mode-cloud").first().click();
    await expect(page).toHaveURL(/\/Login/);
  });

  test("enters the app seeded and lands on the Dashboard", async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveURL(/Dashboard/);
    await awaitAppReady(page);
  });

  test("demo mode lands with seeded data", async ({ page }) => {
    await gotoApp(page, "demo");
    await expect(page).toHaveURL(/Dashboard/);
    await awaitAppReady(page);
    // TODO : Verify Test Data
  });
});

test.describe("@smoke core navigation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("navigates between the main tabs", async ({ page }) => {
    await navigateToTransactions(page);
    await expect(page).toHaveURL(/Transactions/);

    await navigateToDashboard(page);
    await expect(page).toHaveURL(/Dashboard/);
  });

  test("opens the Accounts screen with a total balance", async ({ page }) => {
    await navigateToAccounts(page);
    await expect(page.getByText("Total Account Balance:")).toBeVisible();
  });
});

test.describe("@smoke account journey", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await navigateToAccounts(page);
  });

  test("creates an account under a seeded category", async ({ page }) => {
    const accountName = `Smoke Account ${Date.now()}`;
    await createAccount(page, { name: accountName, categoryName: "Cash", balance: "1234" });

    const row = listItem(page, accountName);
    await expect(row).toBeVisible();
    await expect(row).toContainText("$1,234.00");
  });
});
