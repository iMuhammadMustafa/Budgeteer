import { expect } from "@playwright/test";

import { gotoApp, test } from "../fixtures/app";
import { navigateToSettings } from "../utils/helpers/navigation";

test.describe("@local-only settings persistence", () => {
  test("updates the primary currency", async ({ page }) => {
    await gotoApp(page);
    await navigateToSettings(page);
    await page.getByTestId("btn-settings-currency").click();
    await page.waitForURL(/\/Settings\/Currency/);
    await page.getByTestId("input-currency-search").fill("EUR");
    await page.getByTestId("btn-currency-EUR").click();

    await navigateToSettings(page);
    await expect(page.getByTestId("btn-settings-currency").filter({ visible: true }).first()).toContainText("EUR");
  });

  test("updates the system-category configuration mapping", async ({ page }) => {
    await gotoApp(page);
    await navigateToSettings(page);
    await page.getByTestId("btn-settings-system-categories").click();
    await page.waitForURL(/\/Settings\/SystemCategories/);

    await page.getByTestId("btn-system-category-AccountOpertationsCategory").click();
    await page.locator('[data-testid^="btn-system-category-option-"]').filter({ hasText: "Fuel" }).first().click();

    await expect(page.getByTestId("btn-system-category-AccountOpertationsCategory")).toContainText("Fuel");
  });
});
