import { gotoApp, test } from "../fixtures/app";
import { expect } from "@playwright/test";

/**
 * Dashboard journeys, folding in the legacy dashboard spec's chart + period
 * assertions. Uses demo mode so the charts have data to render.
 */
test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, "demo");
  });

  test("renders chart cards backed by an SVG", async ({ page }) => {
    await expect(page.getByTestId("chart-card-week")).toBeVisible();
    await expect(page.getByTestId("chart-card-categoriesMonth")).toBeVisible();
    // The chart body is an SVG (ui/charts) — scope to a card so we don't match
    // a decorative off-screen icon SVG elsewhere in the shell.
    await expect(page.getByTestId("chart-card-categoriesMonth").locator("svg").first()).toBeVisible();
  });

  test("period navigation updates the week chart label", async ({ page }) => {
    const label = page.getByTestId("chart-card-week-period");
    await expect(label).toBeVisible();
    const before = (await label.textContent())?.trim() ?? "";

    await page.getByTestId("chart-card-week-prev").click();
    await expect(label).not.toHaveText(before);

    await page.getByTestId("chart-card-week-next").click();
    await expect(label).toHaveText(before);
  });
});
