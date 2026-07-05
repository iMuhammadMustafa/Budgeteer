import { gotoApp, test } from "../fixtures/app";
import { expect } from "@playwright/test";
import { navigateToSummary } from "../utils/helpers/navigation";

/**
 * Summary / stats journeys, replacing the legacy stats spec (which built its
 * own data over ~7 hard waits). Uses demo mode, which seeds several months of
 * expense history, so the period-by-period grid is populated without setup.
 */
test.describe("summary / stats", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, "demo");
    await navigateToSummary(page);
  });

  test("renders the period bar and a populated grid", async ({ page }) => {
    await expect(page.getByTestId("summary-period-segments")).toBeVisible();
    // Demo has expense history → the grid renders, not the empty state.
    await expect(page.getByText("No expense data")).toHaveCount(0);
  });

  test("switches the period type between monthly / quarterly / yearly", async ({ page }) => {
    for (const key of ["quarterly", "yearly", "monthly"]) {
      await page.getByTestId(`summary-period-segments-${key}`).click();
      // Segment reflects selection and the grid stays populated.
      await expect(page.getByText("No expense data")).toHaveCount(0);
    }
  });

  test("adjusts the number of visible periods", async ({ page }) => {
    const count = page.getByTestId("summary-period-count");
    const before = (await count.textContent())?.trim() ?? "";
    await page.getByTestId("summary-period-plus").click();
    await expect(count).not.toHaveText(before);

    await page.getByTestId("summary-period-minus").click();
    await expect(count).toHaveText(before);
  });

  test("shows the frozen Category axis and a grand Total row", async ({ page }) => {
    // The grid's frozen left column is a "Category" overline header with a
    // "Total" row pinned at the bottom (SummaryGrid) — the legacy
    // current-column + totals-row assertions.
    await expect(page.getByText("Category", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total", { exact: true }).first()).toBeVisible();
  });

  test("lists a seeded expense category in the grid", async ({ page }) => {
    // Demo seeds recurring Rent/Groceries/Fuel expenses, so those category rows
    // populate the grid (legacy "expense category appears in summary table").
    const categories = page.getByText(/^(Rent|Groceries|Fuel)$/);
    await expect(categories.first()).toBeVisible();
  });
});
