import { expect } from "@playwright/test";

import { gotoApp, test } from "../fixtures/app";
import { createAccount, getItemId, listItem, waitForOverlayOpen } from "../utils/forms";
import { navigateToAccounts } from "../utils/helpers/navigation";

test.describe("savings buckets", () => {
  test("creates, edits, allocates, and deletes a bucket without changing the account balance", async ({ page }) => {
    await gotoApp(page);
    await navigateToAccounts(page);

    const stamp = Date.now();
    const account = `Bucket Account ${stamp}`;
    await createAccount(page, { name: account, categoryName: "Cash", balance: "1000" });
    const accountId = await getItemId(page, account);

    await page.getByTestId(`buckets-btn-${accountId}`).click();
    await waitForOverlayOpen(page);
    await page.getByTestId("add-bucket-btn").click();
    await expect(page.getByText("New Bucket", { exact: true })).toBeVisible();

    const original = `Emergency ${stamp}`;
    await page.getByTestId("field-name").fill(original);
    await page.getByTestId("field-targetamount").fill("500");
    await page.getByTestId("field-currentamount").fill("100");
    await page.getByTestId("btn-form-submit").click();

    const bucketRow = page.getByTestId(/^savings-bucket-/).filter({ hasText: original });
    await expect(bucketRow).toBeVisible();
    const bucketTestId = await bucketRow.getAttribute("data-testid");
    const bucketId = bucketTestId?.replace("savings-bucket-", "");
    expect(bucketId).toBeTruthy();

    await bucketRow.click();
    await expect(page.getByText("Edit Bucket", { exact: true })).toBeVisible();
    const updated = `Rainy Day ${stamp}`;
    await page.getByTestId("field-name").fill(updated);
    await page.getByTestId("btn-form-submit").click();
    await expect(page.getByTestId(`savings-bucket-${bucketId}`)).toContainText(updated);

    await page.getByTestId(`allocate-btn-${bucketId}`).click();
    await page.getByTestId(`allocate-input-${bucketId}`).fill("250");
    await page.getByTestId(`save-allocate-${bucketId}`).click();
    await expect(page.getByTestId(`savings-bucket-${bucketId}`)).toContainText("250.00");

    await page.getByTestId(`delete-bucket-btn-${bucketId}`).click();
    await expect(page.getByTestId("confirm-dialog")).toContainText("Delete savings bucket?");
    await page.getByRole("button", { name: "Delete bucket", exact: true }).click();
    await expect(page.getByTestId(`savings-bucket-${bucketId}`)).toHaveCount(0);

    await page.getByTestId("overlay-close").filter({ visible: true }).last().click();
    await expect(listItem(page, account)).toContainText("$1,000.00");
  });
});
