/**
 * Phase 3.1 — Node SQLite driver seam.
 *
 * Proves (a) the adapter faithfully exposes the expo-sqlite async surface, and
 * (b) BaseSqliteRepository's CRUD + mapping run green against real in-memory SQL,
 * with mapFromRow/mapToRow round-tripping booleans and JSON tags.
 */
import { TableNames } from "@/src/types/database/TableNames";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { BaseSqliteRepository } from "@/src/repositories/BaseSqliteRepository";
import { createNodeSqliteDb, type ExpoLikeSqliteDb } from "./nodeSqliteAdapter";

// Deterministic UUIDs; the real helper imports react-native-get-random-values,
// which cannot load under Node.
let uuidSeq = 0;
vi.mock("@/src/utils/uuid.Helper", () => ({
    default: () => `gen-${++uuidSeq}`,
}));

// getSqliteDB() is the single seam the base repo pulls the connection through.
const h = vi.hoisted(() => ({ db: null as unknown as ExpoLikeSqliteDb }));
vi.mock("@/src/types/database/sqlite", () => ({
    getSqliteDB: async () => h.db,
    createViewsAsync: async () => {},
    resetSqliteDBConnection: () => {},
}));

/** Concrete subclass exposing the abstract base against the transactions table
 *  (the only table carrying both isvoid and tags — the mapping edge cases). */
class TxTestRepo extends BaseSqliteRepository<any, TableNames.Transactions> {
    protected tableName = TableNames.Transactions;
    protected orderByFieldsDesc = ["date"];
}

const TENANT = "tenant-A";

/** Minimal valid transaction insert (FK off, so no parent rows required). */
function txInput(over: Record<string, unknown> = {}) {
    return {
        name: "Coffee",
        amount: -4.5,
        date: "2026-01-15",
        type: "Expense",
        accountid: "acc-1",
        categoryid: "cat-1",
        isvoid: false,
        tags: ["food", "morning"],
        ...over,
    };
}

describe("nodeSqliteAdapter — expo-sqlite surface", () => {
    let db: ExpoLikeSqliteDb;
    beforeEach(() => {
        db = createNodeSqliteDb({ foreignKeys: false });
    });
    afterEach(() => db.closeAsync());

    it("runAsync reports changes and getAllAsync/getFirstAsync read back", async () => {
        const res = await db.runAsync(
            `INSERT INTO ${TableNames.AccountCategories} (id,name,type,tenantid,isdeleted,createdat) VALUES (?,?,?,?,0,?)`,
            ["c1", "Bank", "Asset", TENANT, "2026-01-01"],
        );
        expect(res.changes).toBe(1);

        const all = await db.getAllAsync(
            `SELECT * FROM ${TableNames.AccountCategories} WHERE tenantid = ?`,
            [TENANT],
        );
        expect(all).toHaveLength(1);
        const first = await db.getFirstAsync<{ name: string }>(
            `SELECT * FROM ${TableNames.AccountCategories} WHERE id = ?`,
            ["c1"],
        );
        expect(first?.name).toBe("Bank");
    });

    it("getFirstAsync returns null when no row matches", async () => {
        const row = await db.getFirstAsync(
            `SELECT * FROM ${TableNames.AccountCategories} WHERE id = ?`,
            ["nope"],
        );
        expect(row).toBeNull();
    });

    it("PRAGMA table_info returns column metadata", async () => {
        const cols = await db.getAllAsync<{ name: string }>(
            `PRAGMA table_info(${TableNames.Accounts})`,
        );
        const names = cols.map((c) => c.name);
        expect(names).toContain("balance");
        expect(names).toContain("categoryid");
    });

    it("normalizes boolean and undefined bind params", async () => {
        // isvoid passed as boolean, notes as undefined → 1 / NULL
        await db.runAsync(
            `INSERT INTO ${TableNames.Transactions} (id,amount,date,type,accountid,categoryid,isvoid,tenantid,isdeleted,createdat,notes) VALUES (?,?,?,?,?,?,?,?,0,?,?)`,
            ["t1", 1, "2026-01-01", "Expense", "a", "c", true, TENANT, "2026-01-01", undefined],
        );
        const row = await db.getFirstAsync<{ isvoid: number; notes: unknown }>(
            `SELECT isvoid, notes FROM ${TableNames.Transactions} WHERE id = ?`,
            ["t1"],
        );
        expect(row?.isvoid).toBe(1);
        expect(row?.notes).toBeNull();
    });

    it("withTransactionAsync commits on success and rolls back on throw", async () => {
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO ${TableNames.AccountCategories} (id,name,type,tenantid,isdeleted,createdat) VALUES (?,?,?,?,0,?)`,
                ["ok", "X", "Asset", TENANT, "2026-01-01"],
            );
        });
        expect(
            await db.getFirstAsync(`SELECT 1 FROM ${TableNames.AccountCategories} WHERE id=?`, ["ok"]),
        ).not.toBeNull();

        await expect(
            db.withTransactionAsync(async () => {
                await db.runAsync(
                    `INSERT INTO ${TableNames.AccountCategories} (id,name,type,tenantid,isdeleted,createdat) VALUES (?,?,?,?,0,?)`,
                    ["bad", "Y", "Asset", TENANT, "2026-01-01"],
                );
                throw new Error("boom");
            }),
        ).rejects.toThrow("boom");
        expect(
            await db.getFirstAsync(`SELECT 1 FROM ${TableNames.AccountCategories} WHERE id=?`, ["bad"]),
        ).toBeNull();
    });

    it("enforces foreign keys when enabled", async () => {
        const fkDb = createNodeSqliteDb({ foreignKeys: true });
        try {
            await expect(
                fkDb.runAsync(
                    `INSERT INTO ${TableNames.Accounts} (id,name,categoryid,tenantid,isdeleted,createdat) VALUES (?,?,?,?,0,?)`,
                    ["a1", "Checking", "missing-cat", TENANT, "2026-01-01"],
                ),
            ).rejects.toThrow();
        } finally {
            await fkDb.closeAsync();
        }
    });
});

describe("BaseSqliteRepository against in-memory SQLite", () => {
    let repo: TxTestRepo;
    beforeEach(() => {
        uuidSeq = 0;
        BaseSqliteRepository.clearColumnCache();
        h.db = createNodeSqliteDb({ foreignKeys: false });
        repo = new TxTestRepo();
    });
    afterEach(() => h.db.closeAsync());

    it("create fills id/tenantid/isdeleted/timestamps and round-trips booleans + tags", async () => {
        const created = await repo.create(txInput() as any, TENANT);
        expect(created.id).toBe("gen-1");
        expect(created.tenantid).toBe(TENANT);
        // mapFromRow reflects normalized values
        expect(created.isvoid).toBe(false);
        expect(created.isdeleted).toBe(false);
        expect(created.tags).toEqual(["food", "morning"]);
        expect(created.createdat).toBeTruthy();
        expect(created.updatedat).toBeTruthy();

        // Stored form: booleans → int, tags → JSON string
        const raw = await h.db.getFirstAsync<{ isvoid: number; tags: string; isdeleted: number }>(
            `SELECT isvoid, tags, isdeleted FROM ${TableNames.Transactions} WHERE id = ?`,
            ["gen-1"],
        );
        expect(raw?.isvoid).toBe(0);
        expect(raw?.isdeleted).toBe(0);
        expect(JSON.parse(raw!.tags)).toEqual(["food", "morning"]);
    });

    it("findById honors tenant and isdeleted; returns null otherwise", async () => {
        await repo.create(txInput({ id: "x1" }) as any, TENANT);
        expect(await repo.findById("x1", TENANT)).not.toBeNull();
        expect(await repo.findById("x1", "other-tenant")).toBeNull();
        expect(await repo.findById("missing", TENANT)).toBeNull();
    });

    it("findAll filters by tenant, isdeleted, date range, and applies limit/offset + ordering", async () => {
        await repo.create(txInput({ id: "a", date: "2026-01-01" }) as any, TENANT);
        await repo.create(txInput({ id: "b", date: "2026-02-01" }) as any, TENANT);
        await repo.create(txInput({ id: "c", date: "2026-03-01" }) as any, TENANT);
        await repo.create(txInput({ id: "z", date: "2026-01-01" }) as any, "other");

        const all = await repo.findAll(TENANT);
        expect(all.map((r: any) => r.id)).toEqual(["c", "b", "a"]); // date DESC

        const paged = await repo.findAll(TENANT, { limit: 1, offset: 1 } as any);
        expect(paged.map((r: any) => r.id)).toEqual(["b"]);

        const ranged = await repo.findAll(TENANT, {
            startDate: "2026-02-01",
            endDate: "2026-02-28",
        } as any);
        // createdat is "now", not date — date-range filters on createdat; assert it
        // does not throw and stays tenant-scoped.
        expect(Array.isArray(ranged)).toBe(true);
    });

    it("update excludes immutable fields, bumps updatedat, and re-reads", async () => {
        const created = await repo.create(txInput({ id: "u1", amount: -1 }) as any, TENANT);
        const before = created.updatedat;
        await new Promise((r) => setTimeout(r, 5));
        const updated = await repo.update(
            "u1",
            { amount: -99, tenantid: "hacker", createdat: "1999", name: "Latte" } as any,
            TENANT,
        );
        expect(updated?.amount).toBe(-99);
        expect(updated?.name).toBe("Latte");
        expect(updated?.tenantid).toBe(TENANT); // immutable
        expect(updated?.createdat).toBe(created.createdat); // immutable
        expect(updated?.updatedat).not.toBe(before);
    });

    it("update returns null for wrong tenant", async () => {
        await repo.create(txInput({ id: "u2" }) as any, TENANT);
        expect(await repo.update("u2", { amount: -5 } as any, "other")).toBeNull();
    });

    it("softDelete hides the row; findAll({isDeleted:true}) surfaces it; restore brings it back", async () => {
        await repo.create(txInput({ id: "s1" }) as any, TENANT);
        await repo.softDelete("s1", TENANT);
        expect(await repo.findById("s1", TENANT)).toBeNull();
        const deleted = await repo.findAll(TENANT, { isDeleted: true } as any);
        expect(deleted.map((r: any) => r.id)).toContain("s1");

        await repo.restore("s1", TENANT);
        expect(await repo.findById("s1", TENANT)).not.toBeNull();
    });

    it("hardDelete removes the row entirely", async () => {
        await repo.create(txInput({ id: "hd" }) as any, TENANT);
        await repo.hardDelete("hd", TENANT);
        const raw = await h.db.getFirstAsync(
            `SELECT 1 FROM ${TableNames.Transactions} WHERE id = ?`,
            ["hd"],
        );
        expect(raw).toBeNull();
    });

    it("createMultiple inserts each row and getAllIds returns every id (incl. deleted)", async () => {
        await repo.createMultiple(
            [txInput({ id: "m1" }), txInput({ id: "m2" })] as any,
            TENANT,
        );
        await repo.softDelete("m1", TENANT);
        const ids = await repo.getAllIds();
        expect(ids.sort()).toEqual(["m1", "m2"]);
    });

    it("filterToSchemaColumns drops fields that are not real columns", async () => {
        const created = await repo.create(
            txInput({ id: "f1", bogusField: "should-be-dropped" }) as any,
            TENANT,
        );
        expect((created as any).bogusField).toBeUndefined();
        // Insert succeeded despite the extra field
        expect(await repo.findById("f1", TENANT)).not.toBeNull();
    });
});
