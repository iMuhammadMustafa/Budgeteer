import { beforeEach, describe, expect, it, vi } from "vitest";

// Deterministic ids + avoid the react-native-get-random-values polyfill import.
const { uuidMock } = vi.hoisted(() => {
    let n = 0;
    return {
        uuidMock: () => `uuid-${++n}`,
    };
});
vi.mock("@/src/utils/uuid.Helper", () => ({ default: uuidMock }));

import { createFakeAccountRepo, createInMemoryRepo, fakeSession } from "@/src/test-utils/fakeRepo";
import { createTransactionHelper, updateTransactionHelper } from "./transactions.helpers";

const session = fakeSession({ tenantid: "t1", userId: "u1" });

beforeEach(() => {
    // reset the deterministic uuid counter between tests via a fresh module state is
    // not needed; ids only need to be unique within a test, and they are.
});

describe("createTransactionHelper — non-transfer", () => {
    it("creates a single row and applies the amount to the account", async () => {
        const txRepo = createInMemoryRepo();
        const accRepo = createFakeAccountRepo([{ id: "acc-1", tenantid: "t1", balance: 0 }]);
        const form: any = { type: "Expense", amount: -50, accountid: "acc-1", date: "2026-01-01T00:00:00" };

        const created = await createTransactionHelper(form, session, txRepo as any, accRepo as any);

        // exactly one row created, no transfer linking
        expect(txRepo.callsTo("createMultiple")[0].args[0]).toHaveLength(1);
        expect(txRepo.callsTo("update")).toHaveLength(0);
        // account balance moved by the transaction amount
        expect(accRepo.callsTo("updateAccountBalance")).toHaveLength(1);
        expect(accRepo.balanceDelta("acc-1")).toBe(-50);
        expect(created).toBeTruthy();
    });
});

describe("createTransactionHelper — transfer (double-entry)", () => {
    it("creates a mirrored pair, links them, and nets the two accounts to zero", async () => {
        const txRepo = createInMemoryRepo();
        const accRepo = createFakeAccountRepo([
            { id: "acc-src", tenantid: "t1", balance: 0 },
            { id: "acc-dst", tenantid: "t1", balance: 0 },
        ]);
        const form: any = {
            type: "Transfer",
            amount: 100,
            accountid: "acc-src",
            transferaccountid: "acc-dst",
            date: "2026-01-01T00:00:00",
        };

        await createTransactionHelper(form, session, txRepo as any, accRepo as any);

        // two rows created
        const rows = txRepo.callsTo("createMultiple")[0].args[0];
        expect(rows).toHaveLength(2);
        const [src, dst] = rows;
        // paired row mirrors the source: opposite amount, swapped accounts
        expect(dst.amount).toBe(-src.amount);
        expect(dst.accountid).toBe("acc-dst");
        expect(dst.transferaccountid).toBe("acc-src");
        expect(dst.transferid).toBe(src.id);
        // source is linked to the pair after both rows exist
        expect(txRepo.callsTo("update")).toHaveLength(1);
        // DOUBLE-ENTRY INVARIANT: the two account deltas cancel out
        expect(accRepo.balanceDelta("acc-src")).toBe(100);
        expect(accRepo.balanceDelta("acc-dst")).toBe(-100);
        expect(accRepo.balanceDelta("acc-src") + accRepo.balanceDelta("acc-dst")).toBe(0);
    });
});

describe("updateTransactionHelper — no-op", () => {
    it("returns early and touches nothing when the form matches the original", async () => {
        const txRepo = createInMemoryRepo();
        const accRepo = createFakeAccountRepo();
        const original: any = { id: "tx-1", amount: -50, accountid: "acc-1", isvoid: false, name: "Coffee" };
        const form: any = { id: "tx-1", amount: -50, accountid: "acc-1", isvoid: false, name: "Coffee" };

        await updateTransactionHelper(form, original, session, txRepo as any, accRepo as any);

        expect(txRepo.callsTo("update")).toHaveLength(0);
        expect(accRepo.callsTo("updateAccountBalance")).toHaveLength(0);
    });
});

describe("updateTransactionHelper — voiding", () => {
    it("reverses the amount out of the account when a transaction is voided", async () => {
        const txRepo = createInMemoryRepo();
        const accRepo = createFakeAccountRepo([{ id: "acc-1", tenantid: "t1", balance: -50 }]);
        const original: any = { id: "tx-1", amount: -50, accountid: "acc-1", isvoid: false, name: "Coffee" };
        const form: any = { id: "tx-1", amount: -50, accountid: "acc-1", isvoid: true, name: "Coffee" };

        await updateTransactionHelper(form, original, session, txRepo as any, accRepo as any);

        // transaction row updated with the void flag
        expect(txRepo.callsTo("update")).toHaveLength(1);
        // account gets the amount reversed (voiding a -50 expense adds +50 back)
        expect(accRepo.balanceDelta("acc-1")).toBe(50);
    });

    it("reverses both legs when voiding a transfer", async () => {
        const txRepo = createInMemoryRepo();
        const accRepo = createFakeAccountRepo([
            { id: "acc-src", tenantid: "t1", balance: 100 },
            { id: "acc-dst", tenantid: "t1", balance: -100 },
        ]);
        const original: any = {
            id: "tx-1",
            amount: 100,
            accountid: "acc-src",
            transferaccountid: "acc-dst",
            transferid: "tx-2",
            isvoid: false,
            name: "Move",
        };
        const form: any = { ...original, isvoid: true };

        await updateTransactionHelper(form, original, session, txRepo as any, accRepo as any);

        // both the source and its mirror row are updated
        expect(txRepo.callsTo("update").length).toBeGreaterThanOrEqual(2);
        // both accounts reversed, still symmetric
        expect(accRepo.balanceDelta("acc-src")).toBe(-100);
        expect(accRepo.balanceDelta("acc-dst")).toBe(100);
    });
});
