# Legacy E2E specs (quarantined)

These 11 specs were written against the **pre-redesign** UI. The Sage Paper
redesign (see `docs/redesign/`) changed the DOM they target, so they no longer
pass and are **excluded from every Playwright project** via `testIgnore:
"**/legacy/**"` in `playwright.config.ts`. They are kept as the **migration
backlog** and as a reference for the behaviours each journey covered.

The green, running suite is `e2e/tests/smoke.spec.ts` on the new harness.

## What changed in the redesign (why these fail)

| Legacy assumption | Redesigned reality |
|---|---|
| Landing-click login (`loginWithMode`) | `?storageMode=` injection → auto-lands seeded/authed (`gotoApp`) |
| Hamburger `menu` button + drawer | Persistent **sidebar of route links** on web (`getByRole("link", {name})`); collapses to a drawer on mobile |
| Bottom `tab-transactions` / `tab-dashboard` | Sidebar links `/Transactions`, `/Dashboard`, … |
| Modals are `[role="dialog"]` | Overlay is `[data-testid="dialog"]` (+ `overlay-close`) |
| Forms use labelled textboxes + searchable dropdowns | Test-id'd fields (`account-name`, `account-balance`, `account-save`) + quick-pick **pills** (`account-category-pill-<id>`, `account-icon-quick-*`, `account-color-quick-*`) |
| List rows: single `list-item-<id>` | Three nested nodes: `list-item-<id>` (container), `-press`, `-row` — anchor with `/^list-item-[0-9a-f-]+$/` |
| ~86 `waitForTimeout` hard waits | Web-first assertions + `awaitAppReady` (lint-enforced: `playwright/no-wait-for-timeout`) |
| `for (mode of ["local","cloud"])` loop | Playwright **projects** `chromium-local` / `chromium-cloud`; mode via `projectMode()` |

## Migration method (proven on Accounts)

1. Start the static server: `npm run web:export` then `npm run web:serve`.
2. Discover the redesigned selectors for the target screen by launching a
   throwaway Playwright inspection that dumps visible `[data-testid]`s, roles,
   aria-labels and inputs (see git history for `scratch-inspect.mjs`).
3. Add redesign-matched helpers to `e2e/utils/forms.ts` (create/edit) and
   `e2e/utils/helpers/navigation.ts` (already migrated).
4. Rewrite the journey with `gotoApp(page)` + `test` from `../fixtures/app`,
   the `forms.ts` helpers, and web-first assertions — **no hard waits**.
5. Run `npx playwright test <spec> --project=chromium-local` until green.
6. Tag the cloud-relevant subset `@cloud`; tag the mobile-safe subset `@mobile`.

## Backlog (per screen — needs the redesigned form selectors)

- [ ] `accounts.spec.ts` — edit / delete / restore / transfer / balance-adjustment (create is done in smoke)
- [ ] `transactions.spec.ts` — create (keypad form) / edit / void / delete
- [ ] `split-transaction.spec.ts` — split flow (22 hard waits to drop)
- [ ] `account-category.spec.ts`, `transaction-category.spec.ts`, `transaction-group.spec.ts` — category/group CRUD
- [ ] `account-transaction-integration.spec.ts` — cross-entity balance flows
- [ ] `stats.spec.ts` — charts with seeded demo data
- [ ] `dashboard.spec.ts`, `navigation.spec.ts`, `landing.spec.ts` — largely covered by `smoke.spec.ts`; fold in remaining assertions

**Target (Phase 5.6):** ~30–40 journeys total across the new specs, replacing
the ~95 CRUD-matrix cases here. `@smoke` (~6–10, every PR) + core flows in
`chromium-local`; cloud-only auth/RLS-adjacent flows in `chromium-cloud`.
