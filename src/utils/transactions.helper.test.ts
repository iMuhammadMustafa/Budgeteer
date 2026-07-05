import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import type { TransactionsView } from "../types/database/Tables.Types";
import { duplicateTransaction, getTransactionProp, groupTransactions, initialSearchFilters } from "./transactions.helper";

const tx = (over: Partial<TransactionsView>): TransactionsView =>
    ({ id: "t", amount: 0, type: "Expense", name: "n", date: "2026-01-01T00:00:00", isvoid: false, accountid: "a", categoryid: "c", ...over }) as TransactionsView;

describe("getTransactionProp", () => {
    it.each([
        ["Income", "Plus", "income"],
        ["Expense", "Minus", "expense"],
        ["Transfer", "ArrowLeftRight", "transfer"],
        ["Adjustment", "Wrench", "warning"],
        ["Refund", "Wrench", "warning"],
        ["Initial", "Wallet", "info"],
    ])("maps %s to icon %s", (type, icon, textColor) => {
        const p = getTransactionProp(type);
        expect(p.iconName).toBe(icon);
        expect(p.textColor).toBe(textColor);
    });
    it.each([null, "Unknown", ""])("falls back to CircleHelp for %j", (type) => {
        expect(getTransactionProp(type).iconName).toBe("CircleHelp");
    });
});

describe("groupTransactions", () => {
    it("returns an empty object for no transactions", () => {
        expect(groupTransactions([])).toEqual({});
    });
    it("groups by formatted day and sums amounts", () => {
        const grouped = groupTransactions([
            tx({ id: "1", date: "2026-01-01T09:00:00", amount: 10 }),
            tx({ id: "2", date: "2026-01-01T18:00:00", amount: 5 }),
            tx({ id: "3", date: "2026-01-02T12:00:00", amount: 100 }),
        ]);
        const jan1 = dayjs("2026-01-01").format("ddd, DD MMM YYYY");
        const jan2 = dayjs("2026-01-02").format("ddd, DD MMM YYYY");
        expect(grouped[jan1].amount).toBe(15);
        expect(grouped[jan1].transactions).toHaveLength(2);
        expect(grouped[jan2].amount).toBe(100);
    });
    it("excludes void transactions from the day total but keeps them in the list", () => {
        const day = dayjs("2026-01-01").format("ddd, DD MMM YYYY");
        const grouped = groupTransactions([
            tx({ id: "1", date: "2026-01-01T09:00:00", amount: 10 }),
            tx({ id: "2", date: "2026-01-01T10:00:00", amount: 999, isvoid: true }),
        ]);
        expect(grouped[day].amount).toBe(10);
        expect(grouped[day].transactions).toHaveLength(2);
    });
    it("treats null amounts as zero", () => {
        const day = dayjs("2026-01-01").format("ddd, DD MMM YYYY");
        const grouped = groupTransactions([tx({ id: "1", amount: null as unknown as number })]);
        expect(grouped[day].amount).toBe(0);
    });
});

describe("duplicateTransaction", () => {
    it("carries over core fields and resets metadata", () => {
        const source = tx({ id: "orig", amount: 42, type: "Income", name: "Salary", payee: "Acme", accountid: "a1", categoryid: "c1" });
        const dup = duplicateTransaction(source);
        expect(dup).toMatchObject({ amount: 42, type: "Income", name: "Salary", payee: "Acme", accountid: "a1", categoryid: "c1", isdeleted: false });
        expect(dup).not.toHaveProperty("id"); // new row, no id copied
        expect(dayjs(dup.date).isValid()).toBe(true);
    });
    it("defaults a null amount to zero", () => {
        expect(duplicateTransaction(tx({ amount: null as unknown as number })).amount).toBe(0);
    });
    it("carries transferaccountid so a duplicated transfer keeps both legs", () => {
        const source = tx({ id: "orig", type: "Transfer", accountid: "src", transferaccountid: "dst" });
        const dup = duplicateTransaction(source);
        expect(dup.transferaccountid).toBe("dst"); // regression: was dropped → orphaned single-leg transfer
        expect(dup).not.toHaveProperty("transferid"); // fresh pair id is minted by the create path
    });
});

describe("initialSearchFilters", () => {
    it("starts at offset 0 with a page size", () => {
        expect(initialSearchFilters).toEqual({ offset: 0, limit: 10 });
    });
});
