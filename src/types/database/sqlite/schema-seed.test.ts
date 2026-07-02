/**
 * Phase 3.2 — Migration + seed tests.
 *
 * The SQLite layer has no version-stepped migration chain; `schema.ts` is a set
 * of idempotent `CREATE TABLE IF NOT EXISTS` DDL that is the from-scratch schema.
 * So the "migration" surface to protect is: (a) applying that DDL from an empty
 * database yields exactly the expected tables/columns/indices/views, and (b) the
 * seed routines populate a fresh schema with FK-consistent data.
 *
 * Seed bugs and schema drift are the data-loss class this suite guards.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { TableNames, ViewNames } from "../TableNames";
import { ALL_CREATE_TABLES, CREATE_INDICES } from "./schema";
import { ALL_CREATE_VIEWS } from "./views";
import { createNodeSqliteDb, type ExpoLikeSqliteDb } from "@/src/test-utils/nodeSqliteAdapter";

// seedDemo pulls in the RN-only uuid helper; stub with deterministic ids.
let uuidSeq = 0;
vi.mock("@/src/utils/uuid.Helper", () => ({
    default: () => `demo-${(++uuidSeq).toString().padStart(6, "0")}`,
}));

// Seed routines read the connection through getSqliteDB(); point it at a fresh
// in-memory adapter per test.
const h = vi.hoisted(() => ({ db: null as unknown as ExpoLikeSqliteDb }));
vi.mock("./index", () => ({
    getSqliteDB: async () => h.db,
    createViewsAsync: async () => {},
    resetSqliteDBConnection: () => {},
}));

const EXPECTED_TABLES = [
    TableNames.AccountCategories,
    TableNames.Accounts,
    TableNames.TransactionGroups,
    TableNames.TransactionCategories,
    TableNames.Transactions,
    TableNames.Configurations,
    TableNames.Recurrings,
    TableNames.SavingsBuckets,
    TableNames.TransactionItems,
];

const EXPECTED_VIEWS = Object.values(ViewNames);

/** Column names present in a table, lowercased. */
async function columnsOf(db: ExpoLikeSqliteDb, table: string): Promise<string[]> {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return cols.map((c) => c.name.toLowerCase());
}

describe("schema applied from scratch", () => {
    let db: ExpoLikeSqliteDb;
    beforeEach(() => {
        db = createNodeSqliteDb();
    });
    afterEach(() => db.closeAsync());

    it("creates every expected table", async () => {
        const rows = await db.getAllAsync<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
        );
        const names = rows.map((r) => r.name).sort();
        expect(names).toEqual([...EXPECTED_TABLES].sort());
    });

    it("creates every expected view", async () => {
        const rows = await db.getAllAsync<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type = 'view'`,
        );
        const names = rows.map((r) => r.name).sort();
        expect(names).toEqual([...EXPECTED_VIEWS].sort());
    });

    it("creates all declared indices", async () => {
        const rows = await db.getAllAsync<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'`,
        );
        expect(rows).toHaveLength(CREATE_INDICES.length);
    });

    it("re-applying DDL is idempotent (IF NOT EXISTS)", async () => {
        for (const stmt of [...ALL_CREATE_TABLES, ...CREATE_INDICES, ...ALL_CREATE_VIEWS]) {
            await expect(db.execAsync(stmt)).resolves.toBeUndefined();
        }
        const tables = await db.getAllAsync<{ name: string }>(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
        );
        expect(tables).toHaveLength(EXPECTED_TABLES.length);
    });

    it("accounts table carries the expected key columns", async () => {
        const cols = await columnsOf(db, TableNames.Accounts);
        for (const c of ["id", "name", "balance", "currency", "categoryid", "tenantid", "isdeleted", "createdat"]) {
            expect(cols).toContain(c);
        }
    });

    it("transactions table carries fx, transfer, split, and tag columns", async () => {
        const cols = await columnsOf(db, TableNames.Transactions);
        for (const c of [
            "amount", "original_amount", "original_currency", "exchange_rate",
            "transferaccountid", "transferid", "splitfromid", "isvoid", "tags",
        ]) {
            expect(cols).toContain(c);
        }
    });

    it("stats/running-balance views are queryable on an empty DB", async () => {
        // A view that fails to compile would throw here.
        await expect(
            db.getAllAsync(`SELECT * FROM ${ViewNames.ViewAccountsWithRunningBalance}`),
        ).resolves.toEqual([]);
        await expect(
            db.getAllAsync(`SELECT * FROM ${ViewNames.StatsMonthlyCategoriesTransactions}`),
        ).resolves.toEqual([]);
        await expect(
            db.getAllAsync(`SELECT * FROM ${ViewNames.TransactionsView}`),
        ).resolves.toEqual([]);
    });
});

describe("seedSqliteDB (local seed) on a fresh schema", () => {
    beforeEach(async () => {
        h.db = createNodeSqliteDb();
        const { seedSqliteDB } = await import("./seed");
        await seedSqliteDB();
    });
    afterEach(() => h.db.closeAsync());

    it("populates groups, categories, account categories, and configurations", async () => {
        const count = async (t: string) =>
            (await h.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`))?.n;
        expect(await count(TableNames.TransactionGroups)).toBe(8);
        expect(await count(TableNames.TransactionCategories)).toBe(25);
        expect(await count(TableNames.AccountCategories)).toBe(6);
        expect(await count(TableNames.Configurations)).toBe(2);
    });

    it("stores the account-operations category config with the reserved 'table' column", async () => {
        const cfg = await h.db.getFirstAsync<{ value: string; table: string }>(
            `SELECT value, "table" FROM ${TableNames.Configurations} WHERE type = 'AccountOpertationsCategory'`,
        );
        expect(cfg?.value).toBe("5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9");
        expect(cfg?.table).toBe(TableNames.TransactionCategories);
    });

    it("leaves no dangling foreign keys (categories → groups)", async () => {
        const violations = await h.db.getAllAsync(`PRAGMA foreign_key_check`);
        expect(violations).toEqual([]);
    });

    it("is idempotent — a second seed does not duplicate rows (INSERT OR IGNORE)", async () => {
        const { seedSqliteDB } = await import("./seed");
        await seedSqliteDB();
        const n = (await h.db.getFirstAsync<{ n: number }>(
            `SELECT COUNT(*) AS n FROM ${TableNames.TransactionGroups}`,
        ))?.n;
        expect(n).toBe(8);
    });
});

describe("seedSqliteDemoDB (demo seed) on a fresh schema", () => {
    beforeEach(async () => {
        uuidSeq = 0;
        h.db = createNodeSqliteDb();
        const { seedSqliteDemoDB } = await import("./seedDemo");
        await seedSqliteDemoDB();
    });
    afterEach(() => h.db.closeAsync());

    it("creates accounts and transactions", async () => {
        const accounts = await h.db.getFirstAsync<{ n: number }>(
            `SELECT COUNT(*) AS n FROM ${TableNames.Accounts}`,
        );
        const txns = await h.db.getFirstAsync<{ n: number }>(
            `SELECT COUNT(*) AS n FROM ${TableNames.Transactions}`,
        );
        expect((accounts?.n ?? 0)).toBeGreaterThan(0);
        expect((txns?.n ?? 0)).toBeGreaterThan(0);
    });

    it("produces FK-consistent demo data", async () => {
        const violations = await h.db.getAllAsync(`PRAGMA foreign_key_check`);
        expect(violations).toEqual([]);
    });
});
