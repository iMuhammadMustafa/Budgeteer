/**
 * Phase 3.3 — Per-repo CRUD + tenant scoping against in-memory SQLite.
 *
 * Every concrete SQLite repo is exercised through the real base SQL: CRUD,
 * soft-delete → restore, column mapping, custom query methods, and — the
 * headline invariant — tenant isolation. Two tenants (A, B) are seeded with an
 * identical object graph; every read/write path is asserted to only ever touch
 * the caller's tenant.
 */
import { TableNames } from "@/src/types/database/TableNames";
import { BaseSqliteRepository } from "@/src/repositories/BaseSqliteRepository";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNodeSqliteDb, type ExpoLikeSqliteDb } from "@/src/test-utils/nodeSqliteAdapter";

let uuidSeq = 0;
vi.mock("@/src/utils/uuid.Helper", () => ({
    default: () => `gen-${++uuidSeq}`,
}));

const h = vi.hoisted(() => ({ db: null as unknown as ExpoLikeSqliteDb }));
vi.mock("@/src/types/database/sqlite", () => ({
    getSqliteDB: async () => h.db,
    createViewsAsync: async () => {},
    resetSqliteDBConnection: () => {},
}));

// Repos import the module singleton lazily via getSqliteDB(), so importing them
// after the mock is registered is safe.
import { AccountCategorySqliteRepository } from "./AccountCategories.sqlite";
import { AccountSqliteRepository } from "./Accounts.sqlite";
import { ConfigurationSqliteRepository } from "./Configurations.sqlite";
import { RecurringSqliteRepository } from "./Recurrings.sqlite";
import { SavingsBucketSqliteRepository } from "./SavingsBuckets.sqlite";
import { TransactionCategorySqliteRepository } from "./TransactionCategories.sqlite";
import { TransactionGroupSqliteRepository } from "./TransactionGroups.sqlite";
import { TransactionItemSqliteRepository } from "./TransactionItems.sqlite";
import { TransactionSqliteRepository } from "./Transactions.sqlite";

const A = "tenant-A";
const B = "tenant-B";
const NOW = "2026-01-01T00:00:00.000Z";

/** Insert an arbitrary row with dynamic columns (quotes the reserved word). */
async function ins(table: string, row: Record<string, unknown>): Promise<void> {
    const cols = Object.keys(row);
    const quoted = cols.map((c) => (c === "table" ? `"table"` : c));
    const placeholders = cols.map(() => "?").join(", ");
    await h.db.runAsync(
        `INSERT INTO ${table} (${quoted.join(", ")}) VALUES (${placeholders})`,
        cols.map((c) => row[c]),
    );
}

/**
 * Seed the full parent graph for one tenant with deterministic, tenant-suffixed
 * ids so cross-tenant leakage is easy to assert.
 */
async function seedTenant(t: string) {
    const s = t === A ? "A" : "B";
    await ins(TableNames.AccountCategories, {
        id: `ac-${s}`, name: "Bank", type: "Asset", tenantid: t, isdeleted: 0, createdat: NOW,
    });
    await ins(TableNames.Accounts, {
        id: `acct-${s}`, name: "Checking", balance: 100, categoryid: `ac-${s}`,
        tenantid: t, isdeleted: 0, createdat: NOW,
    });
    await ins(TableNames.TransactionGroups, {
        id: `grp-${s}`, name: "Food", type: "Expense", tenantid: t, isdeleted: 0, createdat: NOW,
    });
    await ins(TableNames.TransactionCategories, {
        id: `cat-${s}`, name: "Groceries", groupid: `grp-${s}`, type: "Expense",
        tenantid: t, isdeleted: 0, createdat: NOW,
    });
    await ins(TableNames.Transactions, {
        id: `tx-${s}`, name: `Coffee ${s}`, amount: -10, date: "2026-01-15", type: "Expense",
        accountid: `acct-${s}`, categoryid: `cat-${s}`, isvoid: 0, tenantid: t, isdeleted: 0, createdat: NOW,
    });
}

beforeEach(async () => {
    uuidSeq = 0;
    BaseSqliteRepository.clearColumnCache();
    h.db = createNodeSqliteDb(); // FK on — matches production
    await seedTenant(A);
    await seedTenant(B);
});
afterEach(() => h.db.closeAsync());

// ─── Generic base-CRUD + tenant-isolation contract ──────────────────────────
describe("AccountCategorySqliteRepository (base CRUD + isolation)", () => {
    const repo = new AccountCategorySqliteRepository();

    it("findAll is tenant-scoped", async () => {
        const a = await repo.findAll(A);
        expect(a.map((r: any) => r.id)).toEqual(["ac-A"]);
        const b = await repo.findAll(B);
        expect(b.map((r: any) => r.id)).toEqual(["ac-B"]);
    });

    it("findById never crosses tenants", async () => {
        expect(await repo.findById("ac-A", A)).not.toBeNull();
        expect(await repo.findById("ac-A", B)).toBeNull();
    });

    it("create → update → softDelete → restore round trip stays in tenant", async () => {
        const created = await repo.create(
            { name: "Cash", type: "Asset" } as any,
            A,
        );
        expect(created.tenantid).toBe(A);

        const updated = await repo.update(created.id, { name: "Wallet" } as any, A);
        expect(updated?.name).toBe("Wallet");
        // Wrong tenant cannot update
        expect(await repo.update(created.id, { name: "Hacked" } as any, B)).toBeNull();

        await repo.softDelete(created.id, A);
        expect(await repo.findById(created.id, A)).toBeNull();
        await repo.restore(created.id, A);
        expect(await repo.findById(created.id, A)).not.toBeNull();

        // Wrong-tenant softDelete is a no-op
        await repo.softDelete(created.id, B);
        expect(await repo.findById(created.id, A)).not.toBeNull();
    });
});

describe("AccountSqliteRepository", () => {
    const repo = new AccountSqliteRepository();

    it("findAllWithCategory attaches the joined category and is tenant-scoped", async () => {
        const rows = await repo.findAllWithCategory(A);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("acct-A");
        expect(rows[0].category?.id).toBe("ac-A");
    });

    it("findByIdWithBalance returns running balance from the view", async () => {
        const res = await repo.findByIdWithBalance("acct-A", A);
        expect(res?.runningbalance).toBe(-10); // single -10 tx
        expect(await repo.findByIdWithBalance("acct-A", B)).toBeNull();
    });

    it("updateAccountBalance mutates only the scoped account and throws off-tenant", async () => {
        const newBal = await repo.updateAccountBalance("acct-A", 50, A);
        expect(newBal).toBe(150);
        await expect(repo.updateAccountBalance("acct-A", 50, B)).rejects.toThrow("Account not found");
    });

    it("getTotalAccountBalance and getAccountRunningBalance are tenant-scoped", async () => {
        const total = await repo.getTotalAccountBalance(A);
        expect(total?.totalbalance).toBe(-10);
        const rb = await repo.getAccountRunningBalance("acct-A", A);
        expect(rb?.runningbalance).toBe(-10);
        // Off-tenant account id yields the zero fallback
        const rbCross = await repo.getAccountRunningBalance("acct-A", B);
        expect(rbCross?.runningbalance).toBe(0);
    });

    it("getAccountOpenedTransaction throws when there is no Initial transaction", async () => {
        await expect(repo.getAccountOpenedTransaction("acct-A", A)).rejects.toThrow();
    });
});

describe("TransactionGroupSqliteRepository", () => {
    const repo = new TransactionGroupSqliteRepository();
    it("CRUD + isolation", async () => {
        expect((await repo.findAll(A)).map((r: any) => r.id)).toEqual(["grp-A"]);
        const g = await repo.create({ name: "Bills", type: "Expense" } as any, A);
        expect(g.tenantid).toBe(A);
        expect(await repo.findById(g.id, B)).toBeNull();
    });
});

describe("TransactionCategorySqliteRepository", () => {
    const repo = new TransactionCategorySqliteRepository();

    it("findAllWithGroup attaches the joined group, tenant-scoped", async () => {
        const rows = await repo.findAllWithGroup(A);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("cat-A");
        expect(rows[0].group?.id).toBe("grp-A");
        // No leakage of tenant B's category
        expect(rows.some((r: any) => r.id === "cat-B")).toBe(false);
    });
});

describe("TransactionSqliteRepository", () => {
    const repo = new TransactionSqliteRepository();

    it("findAllFromView is tenant-scoped and maps isvoid to boolean", async () => {
        const rows = await repo.findAllFromView(A, {} as any);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("tx-A");
        expect(rows[0].isvoid).toBe(false);
    });

    it("findAllFromView honors account, type, and name filters", async () => {
        expect(await repo.findAllFromView(A, { accountid: "acct-B" } as any)).toHaveLength(0);
        expect(await repo.findAllFromView(A, { type: "Income" } as any)).toHaveLength(0);
        expect(await repo.findAllFromView(A, { name: "coffee" } as any)).toHaveLength(1);
    });

    it("findByName searches the distinct view within tenant", async () => {
        const results = await repo.findByName("coffee", A);
        expect(results).toHaveLength(1);
        expect(results[0].label).toBe("Coffee A");
        expect(await repo.findByName("coffee", B)).toHaveLength(1); // B has its own
        expect((await repo.findByName("coffee", B))[0].label).toBe("Coffee B");
    });

    it("getAccountBalanceAtDate sums non-void transactions up to the date, tenant-scoped", async () => {
        expect(await repo.getAccountBalanceAtDate("acct-A", new Date("2026-02-01"), A)).toBe(-10);
        // Before the tx date → 0
        expect(await repo.getAccountBalanceAtDate("acct-A", new Date("2026-01-01"), A)).toBe(0);
        // Off-tenant → 0
        expect(await repo.getAccountBalanceAtDate("acct-A", new Date("2026-02-01"), B)).toBe(0);
    });

    it("findBySplitFromId returns only children of the given parent, tenant-scoped", async () => {
        await ins(TableNames.Transactions, {
            id: "split-A", name: "Split", amount: -3, date: "2026-01-16", type: "Expense",
            accountid: "acct-A", categoryid: "cat-A", splitfromid: "tx-A", isvoid: 0,
            tenantid: A, isdeleted: 0, createdat: NOW,
        });
        const kids = await repo.findBySplitFromId("tx-A", A);
        expect(kids.map((r) => r.id)).toEqual(["split-A"]);
        expect(await repo.findBySplitFromId("tx-A", B)).toHaveLength(0);
    });

    it("findByTransferId returns the matching transfer leg, throws when absent", async () => {
        // transferid is a self-FK to transactions(id), so it must point at a real row.
        await ins(TableNames.Transactions, {
            id: "xfer-A", name: "Transfer", amount: 25, date: "2026-01-17", type: "Transfer",
            accountid: "acct-A", categoryid: "cat-A", transferid: "tx-A", isvoid: 0,
            tenantid: A, isdeleted: 0, createdat: NOW,
        });
        const leg = await repo.findByTransferId("tx-A", A);
        expect(leg.id).toBe("xfer-A");
        await expect(repo.findByTransferId("tx-A", B)).rejects.toThrow("Transfer transaction not found");
    });

    it("mapFromRow round-trips tags JSON through a real create", async () => {
        const created = await repo.create(
            {
                name: "Tagged", amount: -1, date: "2026-01-20", type: "Expense",
                accountid: "acct-A", categoryid: "cat-A", tags: ["x", "y"],
            } as any,
            A,
        );
        const reread = await repo.findById(created.id, A);
        expect((reread as any).tags).toEqual(["x", "y"]);
    });
});

describe("ConfigurationSqliteRepository", () => {
    const repo = new ConfigurationSqliteRepository();
    beforeEach(async () => {
        await ins(TableNames.Configurations, {
            id: "cfg-A", key: "id", value: "val-A", type: "Ops",
            table: TableNames.TransactionCategories, tenantid: A, isdeleted: 0, createdat: NOW,
        });
    });

    it("getConfiguration returns the scoped row", async () => {
        const cfg = await repo.getConfiguration(TableNames.TransactionCategories, "Ops", "id", A);
        expect(cfg.value).toBe("val-A");
    });

    it("getConfiguration throws off-tenant or when missing", async () => {
        await expect(
            repo.getConfiguration(TableNames.TransactionCategories, "Ops", "id", B),
        ).rejects.toThrow("Configuration not found");
    });
});

describe("RecurringSqliteRepository", () => {
    const repo = new RecurringSqliteRepository();
    it("CRUD + isolation with FK-valid refs", async () => {
        const rec = await repo.create(
            {
                name: "Rent", type: "Expense", recurrencerule: "FREQ=MONTHLY",
                categoryid: "cat-A", sourceaccountid: "acct-A",
            } as any,
            A,
        );
        expect(rec.tenantid).toBe(A);
        expect((await repo.findAll(A)).map((r: any) => r.id)).toEqual([rec.id]);
        expect(await repo.findById(rec.id, B)).toBeNull();
    });
});

describe("SavingsBucketSqliteRepository", () => {
    const repo = new SavingsBucketSqliteRepository();
    beforeEach(async () => {
        await ins(TableNames.SavingsBuckets, {
            id: "sb-A1", name: "Vacation", accountid: "acct-A", currentamount: 40,
            tenantid: A, isdeleted: 0, createdat: NOW, displayorder: 1,
        });
        await ins(TableNames.SavingsBuckets, {
            id: "sb-A2", name: "Car", accountid: "acct-A", currentamount: 60,
            tenantid: A, isdeleted: 0, createdat: NOW, displayorder: 2,
        });
        await ins(TableNames.SavingsBuckets, {
            id: "sb-B1", name: "Other", accountid: "acct-B", currentamount: 999,
            tenantid: B, isdeleted: 0, createdat: NOW, displayorder: 1,
        });
    });

    it("findByAccountId returns only the account's buckets in the caller's tenant", async () => {
        const buckets = await repo.findByAccountId("acct-A", A);
        expect(buckets.map((b) => b.id).sort()).toEqual(["sb-A1", "sb-A2"]);
        expect(await repo.findByAccountId("acct-B", A)).toHaveLength(0);
    });

    it("getTotalAllocated sums currentamount, tenant-scoped", async () => {
        expect(await repo.getTotalAllocated("acct-A", A)).toBe(100);
        expect(await repo.getTotalAllocated("acct-B", A)).toBe(0);
    });
});

describe("TransactionItemSqliteRepository", () => {
    const repo = new TransactionItemSqliteRepository();
    beforeEach(async () => {
        await ins(TableNames.TransactionItems, {
            id: "ti-A1", transactionid: "tx-A", name: "Item1", amount: 5,
            tenantid: A, isdeleted: 0, createdat: NOW, displayorder: 1,
        });
        await ins(TableNames.TransactionItems, {
            id: "ti-B1", transactionid: "tx-B", name: "ItemB", amount: 7,
            tenantid: B, isdeleted: 0, createdat: NOW, displayorder: 1,
        });
    });

    it("findByTransactionId is tenant-scoped", async () => {
        const items = await repo.findByTransactionId("tx-A", A);
        expect(items.map((i) => i.id)).toEqual(["ti-A1"]);
        expect(await repo.findByTransactionId("tx-A", B)).toHaveLength(0);
    });

    it("deleteByTransactionId soft-deletes only within tenant", async () => {
        await repo.deleteByTransactionId("tx-A", B); // wrong tenant → no effect
        expect(await repo.findByTransactionId("tx-A", A)).toHaveLength(1);
        await repo.deleteByTransactionId("tx-A", A);
        expect(await repo.findByTransactionId("tx-A", A)).toHaveLength(0);
    });

    it("voidByTransactionId sets isvoid only within tenant", async () => {
        await repo.voidByTransactionId("tx-A", B); // wrong tenant → no effect
        expect(((await repo.findByTransactionId("tx-A", A))[0] as any).isvoid).toBe(false);
        await repo.voidByTransactionId("tx-A", A);
        expect(((await repo.findByTransactionId("tx-A", A))[0] as any).isvoid).toBe(true);
    });
});

describe("cross-cutting: getAllIds spans tenants (documented import-dedup behavior)", () => {
    it("returns ids from all tenants (no tenant filter)", async () => {
        const repo = new AccountCategorySqliteRepository();
        const ids = await repo.getAllIds();
        expect(ids.sort()).toEqual(["ac-A", "ac-B"]);
    });
});
