/**
 * Phase 4.2 — Repository contract suite (Supabase side), against a LIVE local
 * Supabase stack. Runs the same IRepository base-CRUD contract that Phase 3
 * proves for SQLite, so Local and Cloud are shown to behave identically — plus
 * Supabase-specifics (PGRST116 → null, createMultiple, soft-delete/restore).
 *
 * Skips unless `cloudEnabled` (local stack + keys in env). See supabaseHarness.
 * Run with: npm run test:integration:cloud
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
    clientFor,
    cloudEnabled,
    makeServiceClient,
    provisionUser,
    type TestUser,
} from "@/src/test-utils/supabaseHarness";

import { AccountCategorySupaRepository } from "./AccountCategories.supa";
import { AccountSupaRepository } from "./Accounts.supa";
import { ConfigurationSupaRepository } from "./Configurations.supa";
import { RecurringSupaRepository } from "./Recurrings.api.supa";
import { SavingsBucketSupaRepository } from "./SavingsBuckets.supa";
import { TransactionCategorySupaRepository } from "./TransactionCategories.supa";
import { TransactionGroupSupaRepository } from "./TransactionGroups.supa";
import { TransactionItemSupaRepository } from "./TransactionItems.supa";
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
const CLEANUP_TABLES = [
    "transactionitems",
    "recurrings",
    "savingsbuckets",
    "transactions",
    "configurations",
    "transactioncategories",
    "transactiongroups",
    "accounts",
    "accountcategories",
];

describe.skipIf(!cloudEnabled)("Supabase repository contract (live local stack)", () => {
    const admin = cloudEnabled ? makeServiceClient() : (null as any);
    let userA: TestUser;

    beforeAll(async () => {
        userA = await provisionUser(admin, "contract-a@test.local", TENANT_A);
        H.client = await clientFor(userA);
        // Clean any prior rows in this tenant (service bypasses RLS).
        for (const t of CLEANUP_TABLES) {
            await admin.from(t).delete().eq("tenantid", TENANT_A);
        }
    });

    afterAll(async () => {
        for (const t of CLEANUP_TABLES) {
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
                    id: "acct-1",
                    name: "Checking",
                    categoryid: "ac-2",
                    balance: 100,
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect(acct.id).toBe("acct-1");
            expect(await acctRepo.findById("acct-1", TENANT_A)).not.toBeNull();
        });

        it("Transaction create round-trips through PostgREST", async () => {
            // group + category first (FK chain)
            await admin.from("transactiongroups").insert({
                id: "grp-1",
                name: "Food",
                type: "Expense",
                tenantid: TENANT_A,
                createdat: "2026-01-01",
            });
            await admin.from("transactioncategories").insert({
                id: "cat-1",
                name: "Groceries",
                groupid: "grp-1",
                type: "Expense",
                tenantid: TENANT_A,
                createdat: "2026-01-01",
            });
            const txRepo = new TransactionSupaRepository();
            const tx: any = await txRepo.create(
                {
                    id: "tx-1",
                    name: "Coffee",
                    amount: -4.5,
                    date: "2026-01-15",
                    type: "Expense",
                    accountid: "acct-1",
                    categoryid: "cat-1",
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect(tx.id).toBe("tx-1");
            expect(tx.isvoid).toBe(false);
        });

        it("all FK-bearing repositories complete update / soft-delete / restore round-trips", async () => {
            const accountRepo = new AccountSupaRepository();
            const groupRepo = new TransactionGroupSupaRepository();
            const categoryRepo = new TransactionCategorySupaRepository();
            const txRepo = new TransactionSupaRepository();
            const configRepo = new ConfigurationSupaRepository();
            const recurringRepo = new RecurringSupaRepository();
            const bucketRepo = new SavingsBucketSupaRepository();
            const itemRepo = new TransactionItemSupaRepository();

            expect((await accountRepo.update("acct-1", { name: "Cloud Checking" } as any, TENANT_A))?.name).toBe(
                "Cloud Checking",
            );
            await accountRepo.softDelete("acct-1", TENANT_A);
            expect(await accountRepo.findById("acct-1", TENANT_A)).toBeNull();
            await accountRepo.restore("acct-1", TENANT_A);

            const group: any = await groupRepo.create(
                { id: "grp-crud", name: "Bills", type: "Expense", tenantid: TENANT_A, createdat: "2026-01-01" } as any,
                TENANT_A,
            );
            expect((await groupRepo.update(group.id, { name: "Dining" } as any, TENANT_A))?.name).toBe("Dining");
            await groupRepo.softDelete(group.id, TENANT_A);
            expect(await groupRepo.findById(group.id, TENANT_A)).toBeNull();
            await groupRepo.restore(group.id, TENANT_A);

            const category: any = await categoryRepo.create(
                {
                    id: "cat-crud",
                    name: "Restaurants",
                    groupid: group.id,
                    type: "Expense",
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect((await categoryRepo.update(category.id, { name: "Cafes" } as any, TENANT_A))?.name).toBe("Cafes");
            await categoryRepo.softDelete(category.id, TENANT_A);
            expect(await categoryRepo.findById(category.id, TENANT_A)).toBeNull();
            await categoryRepo.restore(category.id, TENANT_A);

            expect((await txRepo.update("tx-1", { amount: -5 } as any, TENANT_A))?.amount).toBe(-5);
            await txRepo.softDelete("tx-1", TENANT_A);
            expect(await txRepo.findById("tx-1", TENANT_A)).toBeNull();
            await txRepo.restore("tx-1", TENANT_A);

            const config: any = await configRepo.create(
                {
                    id: "cfg-1",
                    key: "id",
                    value: "cat-1",
                    type: "AccountOpertationsCategory",
                    table: "transactioncategories",
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect((await configRepo.update(config.id, { value: "cat-1" } as any, TENANT_A))?.value).toBe("cat-1");
            await configRepo.softDelete(config.id, TENANT_A);
            expect(await configRepo.findById(config.id, TENANT_A)).toBeNull();
            await configRepo.restore(config.id, TENANT_A);

            const recurring: any = await recurringRepo.create(
                {
                    id: "rec-1",
                    name: "Rent",
                    amount: -100,
                    type: "Expense",
                    recurringtype: "Standard",
                    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
                    categoryid: "cat-1",
                    sourceaccountid: "acct-1",
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect((await recurringRepo.update(recurring.id, { name: "Mortgage" } as any, TENANT_A))?.name).toBe(
                "Mortgage",
            );
            await recurringRepo.softDelete(recurring.id, TENANT_A);
            expect(await recurringRepo.findById(recurring.id, TENANT_A)).toBeNull();
            await recurringRepo.restore(recurring.id, TENANT_A);

            const bucket: any = await bucketRepo.create(
                {
                    id: "bucket-1",
                    name: "Emergency",
                    accountid: "acct-1",
                    currentamount: 50,
                    targetamount: 500,
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect((await bucketRepo.update(bucket.id, { currentamount: 75 } as any, TENANT_A))?.currentamount).toBe(
                75,
            );
            await bucketRepo.softDelete(bucket.id, TENANT_A);
            expect(await bucketRepo.findById(bucket.id, TENANT_A)).toBeNull();
            await bucketRepo.restore(bucket.id, TENANT_A);

            const item: any = await itemRepo.create(
                {
                    id: "item-1",
                    transactionid: "tx-1",
                    name: "Coffee",
                    amount: 5,
                    tenantid: TENANT_A,
                    createdat: "2026-01-01",
                } as any,
                TENANT_A,
            );
            expect((await itemRepo.update(item.id, { amount: 6 } as any, TENANT_A))?.amount).toBe(6);
            await itemRepo.deleteByTransactionId("tx-1", TENANT_A);
            expect(await itemRepo.findByTransactionId("tx-1", TENANT_A)).toHaveLength(0);
            await itemRepo.restoreByTransactionId("tx-1", TENANT_A);
            expect(await itemRepo.findByTransactionId("tx-1", TENANT_A)).toHaveLength(1);
        });
    });
});
