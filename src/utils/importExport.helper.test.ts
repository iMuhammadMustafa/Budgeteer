import { describe, expect, it } from "vitest";

import { TableNames } from "@/src/types/database/TableNames";
import { formatTableName, formatViewName, getTableIcon } from "./importExport.helper";

describe("getTableIcon", () => {
    it("returns the mapped icon for a known table", () => {
        expect(getTableIcon(TableNames.Accounts)).toBe("Landmark");
        expect(getTableIcon(TableNames.Transactions)).toBe("Receipt");
    });
    it("falls back to Database for an unmapped value", () => {
        expect(getTableIcon("mystery" as TableNames)).toBe("Database");
    });
});

describe("formatTableName", () => {
    it.each([
        ["accounts", "Accounts"],
        ["transactionCategories", "Transaction Categories"],
        ["SavingsBuckets", "Savings Buckets"],
    ])("%j -> %j", (input, expected) => {
        expect(formatTableName(input)).toBe(expected);
    });
});

describe("formatViewName", () => {
    it("replaces underscores and capitalizes", () => {
        expect(formatViewName("net_worth")).toBe("Net worth");
    });
    it("rewrites a stats_ prefix to 'Stats: '", () => {
        expect(formatViewName("stats_monthly")).toContain("Stats:");
    });
    it("strips a leading 'view '", () => {
        expect(formatViewName("view_accounts").startsWith("View")).toBe(false);
    });
});
