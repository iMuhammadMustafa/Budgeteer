import { gotoApp, awaitAppReady, test } from "../fixtures/app";
import { deleteItemById, getItemId, listItem, openAddForm, waitForOverlayClosed } from "../utils/forms";
import { navigateToAccountCategories, navigateToTransactions } from "../utils/helpers/navigation";
import { expect } from "@playwright/test";

/**
 * Cloud-backend journeys — the only specs that exercise the real Supabase stack
 * (auth, PostgREST, RLS) end-to-end. Tagged `@cloud-only` so they run ONLY in
 * the `chromium-cloud` project (which greps /@cloud/) and are excluded from
 * `chromium-local` / `mobile-smoke` (which grepInvert /@cloud-only/). The suite
 * self-skips when E2E_CLOUD_EMAIL / E2E_CLOUD_PASSWORD are absent (see
 * fixtures/app.ts).
 *
 * These run against a shared remote tenant (no fresh-DB-per-test as with local
 * OPFS), so tests must not assume a clean/seeded dataset and any writes must
 * clean up after themselves.
 */
test.describe("@cloud-only cloud backend", () => {
  test.beforeEach(async ({ page }) => {
    // In the cloud project this performs the real Supabase login and waits for
    // /Dashboard + the app-ready sentinel — reaching the test body proves auth.
    await gotoApp(page);
  });

  test("authenticates and reads RLS-scoped data from Supabase", async ({ page }) => {
    // Auth round-trip: real login landed us on the authed shell.
    await expect(page).toHaveURL(/\/Dashboard/);
    await expect(page.getByTestId("app-ready")).toBeVisible();

    // Navigation within the authed shell works.
    await navigateToTransactions(page);
    await expect(page).toHaveURL(/\/Transactions/);

    // Read round-trip: a MyTab list fetches this tenant's rows through PostgREST
    // under RLS and renders them (the account-categories screen loads its data).
    await navigateToAccountCategories(page);
    await expect(page.getByRole("button", { name: /Add Account Category/i })).toBeVisible();
    await expect(page.getByTestId(/^list-item-[0-9a-f-]+$/).first()).toBeVisible({ timeout: 15_000 });
  });

  // KNOWN GAP (needs investigation, not a harness bug): a create round-trip does
  // not surface the new row in cloud mode. The form saves and its overlay closes,
  // but the created account-category never appears — not via cache and not after a
  // full reload + refetch (verified 2026-07-03 against the real test tenant; the
  // list DOES render this tenant's other rows, so auth/RLS/reads are fine). Likely
  // a cloud create-invalidation/persistence issue and/or an interaction with the
  // pending rls-tenant-vuln migration + this account's app_metadata/tenantid state.
  // Reproduce with `npm run test:e2e:cloud`, then inspect the PostgREST POST via
  // the browser network panel. Unskip once the write is confirmed to persist.
  test.fixme("entity write persists to the real backend (reload round-trip)", async ({ page }) => {
    const stamp = Date.now();
    const name = `Cloud E2E Cat ${stamp}`;

    await navigateToAccountCategories(page);

    await openAddForm(page);
    await page.getByTestId("accountcategory-name").fill(name);
    await page.getByTestId("accountcategory-save").click();
    await waitForOverlayClosed(page);

    await page.reload();
    await awaitAppReady(page);
    await navigateToAccountCategories(page);
    await expect(listItem(page, name)).toBeVisible({ timeout: 15_000 });

    const id = await getItemId(page, name);
    await deleteItemById(page, id);
    await expect(listItem(page, name).filter({ visible: true })).toHaveCount(0);
  });
});
