import { gotoApp, awaitAppReady, test } from "../fixtures/app";
import { openAddForm, waitForOverlayClosed } from "../utils/forms";
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

  // Create round-trip against the real backend, verified via the DETAIL page
  // rather than the list.
  //
  // Investigation 2026-07-03: the create is NOT broken. The POST returns 201 with
  // the row (correct tenantid, isdeleted=false) and the onSuccess invalidation
  // refetches it — it's present in the payload. It just isn't *visible in the
  // list*: the list orders `displayorder DESC` and new rows default to
  // `displayorder: 0`, so on the polluted shared cloud tenant (240+ categories,
  // some with displayorder 999300) the new row lands near the bottom, below the
  // virtualized FlatList window. So this test confirms persistence by navigating
  // straight to the detail page by id (deep link → RLS-scoped findById), which
  // doesn't depend on list position. Surfacing new rows at the top of the list is
  // tracked separately (createdat tiebreaker — deferred).
  test("entity write persists to the real backend (detail-page round-trip)", async ({ page }) => {
    const stamp = Date.now();
    const name = `Cloud E2E Cat ${stamp}`;

    await navigateToAccountCategories(page);

    await openAddForm(page);
    await page.getByTestId("accountcategory-name").fill(name);

    // The insert (`.insert().select().single()`) returns the created row as a
    // single object; capture it to get the id + reuse its auth headers for cleanup.
    const [postResp] = await Promise.all([
      page.waitForResponse(
        r =>
          r.url().includes("/rest/v1/accountcategories") &&
          r.request().method() === "POST" &&
          r.status() === 201,
      ),
      page.getByTestId("accountcategory-save").click(),
    ]);
    await waitForOverlayClosed(page);

    const created = (await postResp.json()) as { id: string };
    expect(created.id).toBeTruthy();

    // Confirm via the detail page (deep link) — proves the write persisted and is
    // readable under RLS, independent of where it sorts in the list.
    await page.goto(`/Accounts/Categories/${created.id}?storageMode=cloud`);
    await awaitAppReady(page);
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });

    // Clean up (shared tenant): hard-delete via PostgREST, reusing the POST's
    // apikey + bearer token so it runs under the same authenticated identity.
    const headers = await postResp.request().allHeaders();
    const del = await page.request.delete(
      `${new URL(postResp.url()).origin}/rest/v1/accountcategories?id=eq.${created.id}`,
      { headers: { apikey: headers["apikey"], authorization: headers["authorization"] } },
    );
    expect(del.ok()).toBeTruthy();
  });
});
