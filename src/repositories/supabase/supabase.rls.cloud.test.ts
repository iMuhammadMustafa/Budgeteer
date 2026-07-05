/**
 * Phase 4.3 — RLS attack suite (the pen-test core), against a LIVE local stack.
 *
 * ⚠️ Runs against the RECONSTRUCTED local schema/policies (see the migration),
 * NOT production. It proves the tenant-isolation MODEL and the attack
 * methodology, and doubles as an executable spec for the correct policies.
 * Reconcile with production via `supabase db pull` before trusting as a prod
 * guard (policies live in the dashboard; not in this repo).
 *
 * The policies here read tenantid from server-managed `app_metadata` (the fixed
 * model). The headline regression: a user who rewrites their own `user_metadata`
 * tenantid still gets 0 of another tenant's rows.
 *
 * Skips unless `cloudEnabled`. Run with: npm run test:integration:cloud
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
    cloudEnabled,
    clientFor,
    makeAnonClient,
    makeServiceClient,
    provisionUser,
    type TestUser,
} from "@/src/test-utils/supabaseHarness";
import type { SupabaseClient } from "@supabase/supabase-js";

const TENANT_A = "aaaaaaaa-1111-1111-1111-111111111111";
const TENANT_B = "bbbbbbbb-2222-2222-2222-222222222222";

const TENANT_TABLES = [
    "accountcategories",
    "accounts",
    "transactiongroups",
    "transactioncategories",
    "transactions",
    "configurations",
    "recurrings",
    "savingsbuckets",
    "transactionitems",
] as const;

/** id of the seeded row for each table, per tenant suffix. */
const ROW_ID: Record<string, (s: string) => string> = {
    accountcategories: (s) => `ac-${s}`,
    accounts: (s) => `acct-${s}`,
    transactiongroups: (s) => `grp-${s}`,
    transactioncategories: (s) => `cat-${s}`,
    transactions: (s) => `tx-${s}`,
    configurations: (s) => `cfg-${s}`,
    recurrings: (s) => `rec-${s}`,
    savingsbuckets: (s) => `sb-${s}`,
    transactionitems: (s) => `ti-${s}`,
};

/** Seed a full FK-valid object graph for one tenant using the service client. */
async function seedGraph(admin: SupabaseClient, tenant: string) {
    const s = tenant === TENANT_A ? "A" : "B";
    const rows: [string, Record<string, unknown>][] = [
        ["accountcategories", { id: `ac-${s}`, name: "Bank", type: "Asset", tenantid: tenant, createdat: "2026-01-01" }],
        ["accounts", { id: `acct-${s}`, name: "Checking", categoryid: `ac-${s}`, tenantid: tenant, createdat: "2026-01-01" }],
        ["transactiongroups", { id: `grp-${s}`, name: "Food", type: "Expense", tenantid: tenant, createdat: "2026-01-01" }],
        ["transactioncategories", { id: `cat-${s}`, name: "Groceries", groupid: `grp-${s}`, type: "Expense", tenantid: tenant, createdat: "2026-01-01" }],
        ["transactions", { id: `tx-${s}`, name: "Coffee", amount: -10, date: "2026-01-15", type: "Expense", accountid: `acct-${s}`, categoryid: `cat-${s}`, tenantid: tenant, createdat: "2026-01-01" }],
        ["configurations", { id: `cfg-${s}`, key: "id", value: "v", type: "Ops", table: "transactioncategories", tenantid: tenant, createdat: "2026-01-01" }],
        ["recurrings", { id: `rec-${s}`, name: "Rent", type: "Expense", recurrencerule: "FREQ=MONTHLY", categoryid: `cat-${s}`, sourceaccountid: `acct-${s}`, tenantid: tenant }],
        ["savingsbuckets", { id: `sb-${s}`, name: "Vacation", accountid: `acct-${s}`, tenantid: tenant, createdat: "2026-01-01" }],
        ["transactionitems", { id: `ti-${s}`, transactionid: `tx-${s}`, name: "Item", amount: 5, tenantid: tenant, createdat: "2026-01-01" }],
    ];
    for (const [table, row] of rows) {
        const { error } = await admin.from(table).insert(row);
        if (error) throw new Error(`seed ${table}[${s}]: ${error.message}`);
    }
}

async function cleanup(admin: SupabaseClient) {
    // reverse dependency order
    for (const t of [...TENANT_TABLES].reverse()) {
        await admin.from(t).delete().in("tenantid", [TENANT_A, TENANT_B]);
    }
}

describe.skipIf(!cloudEnabled)("RLS attack table (live local stack)", () => {
    const admin = cloudEnabled ? makeServiceClient() : (null as any);
    let userA: TestUser;
    let userB: TestUser;
    let clientA: SupabaseClient;
    let clientB: SupabaseClient;
    let anon: SupabaseClient;

    beforeAll(async () => {
        userA = await provisionUser(admin, "rls-a@test.local", TENANT_A);
        userB = await provisionUser(admin, "rls-b@test.local", TENANT_B);
        await cleanup(admin);
        await seedGraph(admin, TENANT_A);
        await seedGraph(admin, TENANT_B);
        clientA = await clientFor(userA);
        clientB = await clientFor(userB);
        anon = makeAnonClient();
    });

    afterAll(async () => {
        await cleanup(admin);
        if (userA) await admin.auth.admin.deleteUser(userA.userId);
        if (userB) await admin.auth.admin.deleteUser(userB.userId);
    });

    // Sanity: the authed owner CAN see their own row (proves policies aren't just
    // deny-all, which would make the attack assertions vacuously pass).
    it.each(TENANT_TABLES)("owner (tenant A) can read its own %s row", async (table) => {
        const { data, error } = await clientA.from(table).select("id").eq("id", ROW_ID[table]("A"));
        expect(error).toBeNull();
        expect(data?.length).toBe(1);
    });

    it.each(TENANT_TABLES)("anon cannot read %s (error or 0 rows)", async (table) => {
        const { data, error } = await anon.from(table).select("id");
        const blocked = !!error || (data?.length ?? 0) === 0;
        expect(blocked).toBe(true);
    });

    it.each(TENANT_TABLES)("tenant B cannot READ tenant A's %s row", async (table) => {
        const { data } = await clientB.from(table).select("id").eq("id", ROW_ID[table]("A"));
        expect(data ?? []).toHaveLength(0);
    });

    it.each(TENANT_TABLES)("tenant B cannot UPDATE tenant A's %s row", async (table) => {
        const { data } = await clientB.from(table).update({ updatedby: "attacker" }).eq("id", ROW_ID[table]("A")).select();
        expect(data ?? []).toHaveLength(0);
        // Confirm via service client that A's row is untouched.
        const { data: real } = await admin.from(table).select("updatedby").eq("id", ROW_ID[table]("A")).single();
        expect((real as any)?.updatedby).not.toBe("attacker");
    });

    it.each(TENANT_TABLES)("tenant B cannot DELETE tenant A's %s row", async (table) => {
        await clientB.from(table).delete().eq("id", ROW_ID[table]("A"));
        const { data: still } = await admin.from(table).select("id").eq("id", ROW_ID[table]("A"));
        expect(still ?? []).toHaveLength(1);
    });

    it.each(TENANT_TABLES)("unfiltered select as tenant B returns only B's %s rows", async (table) => {
        const { data, error } = await clientB.from(table).select("tenantid");
        expect(error).toBeNull();
        for (const row of data ?? []) {
            expect((row as any).tenantid).toBe(TENANT_B);
        }
        expect((data ?? []).length).toBeGreaterThan(0); // sees its own
    });

    it("spoofed tenantid on INSERT is rejected by WITH CHECK (B inserting as A)", async () => {
        // FK-light table keeps this focused on the tenant check.
        const { error } = await clientB.from("accountcategories").insert({
            id: "spoof-1", name: "Evil", type: "Asset", tenantid: TENANT_A, createdat: "2026-01-01",
        });
        expect(error).not.toBeNull(); // RLS WITH CHECK violation
        // And nothing landed under A.
        const { data } = await admin.from("accountcategories").select("id").eq("id", "spoof-1");
        expect(data ?? []).toHaveLength(0);
    });

    // ── FIX VERIFICATION (rls-tenant-vuln) ───────────────────────────────────
    // The policies mirror production's `auth.tenantid()` AS FIXED (migration
    // 20260703000000_fix_tenant_isolation): tenantid is read from the
    // SERVER-MANAGED `app_metadata` claim. This test performs the old exploit —
    // an authenticated user rewrites their own `user_metadata.tenantid` — and
    // proves it now gains NOTHING, because policies ignore the client-writable
    // claim. (`updateUser({ data })` can only write user_metadata; app_metadata
    // is not client-writable, so B's effective tenant stays TENANT_B.)
    it("rls-tenant-vuln FIXED: rewriting own user_metadata grants no cross-tenant access", async () => {
        const attacker = await clientFor(userB);

        // Baseline: honest B sees only its own account.
        const before = await attacker.from("accounts").select("id").eq("tenantid", TENANT_A);
        expect(before.data ?? []).toHaveLength(0);

        // The (now-defeated) attack: overwrite the client-writable user_metadata → A.
        const { error: updErr } = await attacker.auth.updateUser({ data: { tenantid: TENANT_A } });
        expect(updErr).toBeNull();
        await attacker.auth.refreshSession(); // fresh JWT carries the tampered claim

        // Confirm the tampering took (attack was actually performed).
        const { data: me } = await attacker.auth.getUser();
        expect((me.user?.user_metadata as any)?.tenantid).toBe(TENANT_A);

        // ✅ BLOCKED: policies read app_metadata (untampered TENANT_B), so B still
        // reads none of tenant A's rows despite the forged user_metadata claim.
        const stolen = await attacker.from("accounts").select("id,name").eq("tenantid", TENANT_A);
        expect(stolen.data ?? []).toHaveLength(0);
    });
});
