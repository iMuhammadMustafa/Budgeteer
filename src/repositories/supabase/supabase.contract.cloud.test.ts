/**
 * Phase 4.2 — Repository contract suite (Supabase side), against a LIVE local
 * Supabase stack. Runs the same IRepository base-CRUD contract that Phase 3
 * proves for SQLite, so Local and Cloud are shown to behave identically — plus
 * Supabase-specifics (PGRST116 → null, createMultiple, soft-delete/restore).
 *
 * Skips unless `cloudEnabled` (local stack + keys in env). See supabaseHarness.
 * Run with: npm run test:integration:cloud
 */
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import {
    cloudEnabled,
    clientFor,
    makeServiceClient,
    provisionUser,
    type TestUser,
} from "@/src/test-utils/supabaseHarness";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AccountCategorySupaRepository } from "./AccountCategories.supa";
import { AccountSupaRepository } from "./Accounts.supa";
import { TransactionSupaRepository } from "./Transactions.supa";

// The repos import a module-singleton supabase client. Proxy it to a swappable
// authed client so tests drive which user (tenant) is making requests.
const H = vi.hoisted(() => ({ client: null as SupabaseClient | null }));
vi.mock("@/src/providers/Supabase", () => ({
    default: new Proxy(
        {},
        {
            get(_t, prop: string) {
                const c = H.client;
                if (!c) throw new Error("Supabase test client not initialized");
                const v = (c as any)[prop];
                return typeof v === "function" ? v.bind(c) : v;
            },
        },
    ),
}));

const TENANT_A = "11111111-1111-1111-1111-111111111111";

describe.skipIf(!cloudEnabled)("Supabase repository contract (live local stack)", () => {
    const admin = cloudEnabled ? makeServiceClient() : (null as any);
    let userA: TestUser;

    beforeAll(async () => {
        userA = await provisionUser(admin, "contract-a@test.local", TENANT_A);
        H.client = await clientFor(userA);
        // Clean any prior rows in this tenant (service bypasses RLS).
        for (const t of ["transactions", "accounts", "accountcategories"]) {
            await admin.from(t).delete().eq("tenantid", TENANT_A);
        }
    });

    afterAll(async () => {
        for (const t of ["transactions", "accounts", "accountcategories"]) {
            await admin.from(t).delete().eq("tenantid", TENANT_A);
        }
        if (userA) await admin.auth.admin.deleteUser(userA.userId);
    });

    describe("AccountCategorySupaRepository — full base-CRUD contract", () => {
        const repo = new AccountCategorySupaRepository();

        it("create returns the row with server-side fields", async () => {
            const row: any = await repo.create(
                { id: "ac-1", name: "Bank", type: "Asset", tenantid: TENANT_A, createdat: "2026-01-01" } as any,
                TENANT_A,
            );
            expect(row.id).toBe("ac-1");
            expect(row.isdeleted).toBe(false);
        });

        it("findById returns the row; foreign tenant / missing → null (PGRST116)", async () => {
            expect(await repo.findById("ac-1", TENANT_A)).not.toBeNull();
            expect(await repo.findById("ac-1", "99999999-9999-9999-9999-999999999999")).toBeNull();
            expect(await repo.findById("nope", TENANT_A)).toBeNull();
        });

        it("findAll is tenant-scoped and honors the isdeleted filter", async () => {
            const all = await repo.findAll(TENANT_A);
            expect(all.map((r: any) => r.id)).toContain("ac-1");
        });

        it("update mutates + returns; no-match → null (PGRST116)", async () => {
            const updated: any = await repo.update("ac-1", { name: "Renamed" } as any, TENANT_A);
            expect(updated.name).toBe("Renamed");
            expect(await repo.update("missing", { name: "x" } as any, TENANT_A)).toBeNull();
        });

        it("softDelete hides, findAll({isDeleted:true}) surfaces, restore brings back", async () => {
            await repo.softDelete("ac-1", TENANT_A);
            expect(await repo.findById("ac-1", TENANT_A)).toBeNull();
            const deleted = await repo.findAll(TENANT_A, { isDeleted: true } as any);
            expect(deleted.map((r: any) => r.id)).toContain("ac-1");
            await repo.restore("ac-1", TENANT_A);
            expect(await repo.findById("ac-1", TENANT_A)).not.toBeNull();
        });

        it("createMultiple inserts a batch", async () => {
            const rows = await repo.createMultiple(
                [
                    { id: "ac-2", name: "Cash", type: "Asset", tenantid: TENANT_A, createdat: "2026-01-01" },
                    { id: "ac-3", name: "Loan", type: "Liability", tenantid: TENANT_A, createdat: "2026-01-01" },
                ] as any,
                TENANT_A,
            );
            expect(rows).toHaveLength(2);
        });
    });

    describe("FK-bearing repos round-trip (parity with SQLite)", () => {
        it("Account create respects the category FK and reads back", async () => {
            const acctRepo = new AccountSupaRepository();
            const acct: any = await acctRepo.create(
                {
                    id: "acct-1", name: "Checking", categoryid: "ac-2", balance: 100,
                    tenantid: TENANT_A, createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect(acct.id).toBe("acct-1");
            expect(await acctRepo.findById("acct-1", TENANT_A)).not.toBeNull();
        });

        it("Transaction create round-trips through PostgREST", async () => {
            // group + category first (FK chain)
            await admin.from("transactiongroups").insert({
                id: "grp-1", name: "Food", type: "Expense", tenantid: TENANT_A, createdat: "2026-01-01",
            });
            await admin.from("transactioncategories").insert({
                id: "cat-1", name: "Groceries", groupid: "grp-1", type: "Expense",
                tenantid: TENANT_A, createdat: "2026-01-01",
            });
            const txRepo = new TransactionSupaRepository();
            const tx: any = await txRepo.create(
                {
                    id: "tx-1", name: "Coffee", amount: -4.5, date: "2026-01-15", type: "Expense",
                    accountid: "acct-1", categoryid: "cat-1", tenantid: TENANT_A, createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect(tx.id).toBe("tx-1");
            expect(tx.isvoid).toBe(false);
        });
    });
});
