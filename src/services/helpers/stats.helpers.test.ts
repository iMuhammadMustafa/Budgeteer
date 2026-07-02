import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "vitest";

// getStatsDailyTransactionsHelper (week mode) calls `.local()`, which the app
// enables globally via dayjs.extend(utc) in src/app/_layout.tsx. Replicate here.
dayjs.extend(utc);

import {
    getStatsDailyTransactionsHelper,
    getStatsMonthlyCategoriesTransactionsDashboardHelper,
    getStatsMonthlyTransactionsTypesHelper,
    getStatsNetWorthGrowthHelper,
} from "./stats.helpers";

describe("getStatsDailyTransactionsHelper", () => {
    it("builds calendar dots grouped by day, de-duped per type", () => {
        const { calendarData, barsData } = getStatsDailyTransactionsHelper([
            { date: "2026-01-05", type: "Income", sum: 100 },
            { date: "2026-01-05", type: "Income", sum: 50 }, // same day+type -> one dot
            { date: "2026-01-05", type: "Expense", sum: -20 },
        ] as any);
        expect(barsData).toBeUndefined(); // week=false
        expect(calendarData["2026-01-05"]!.dots).toHaveLength(2);
        expect(calendarData["2026-01-05"]!.dots!.map((d: any) => d.color)).toEqual(["green", "red"]);
    });

    it("produces a 7-day week series with a 'Today' label and zero-filled gaps", () => {
        const { barsData } = getStatsDailyTransactionsHelper(
            [{ date: "2026-01-07", type: "Expense", sum: -40 }] as any,
            true,
            "2026-01-07", // Wednesday
        );
        expect(barsData).toHaveLength(7);
        const today = barsData!.find((b) => b.x === "Today");
        expect(today?.y).toBe(40); // absolute value
        // days with no data are zeroed
        expect(barsData!.filter((b) => b.y === 0).length).toBe(6);
    });
});

describe("getStatsMonthlyTransactionsTypesHelper", () => {
    it("aggregates income and expense per month, expenses as absolute", async () => {
        const out = await getStatsMonthlyTransactionsTypesHelper([
            { date: "2026-01-10", type: "Income", sum: 1000 },
            { date: "2026-01-20", type: "Expense", sum: -300 },
            { date: "2026-01-25", type: "Expense", sum: -200 },
        ] as any);
        expect(out).toHaveLength(1);
        expect(out[0].barOne).toMatchObject({ label: "Income", value: 1000 });
        expect(out[0].barTwo).toMatchObject({ label: "Expense", value: 500 });
    });
});

describe("getStatsMonthlyCategoriesTransactionsDashboardHelper", () => {
    it("rolls up by group and by category with absolute sums", async () => {
        const { groups, categories } = await getStatsMonthlyCategoriesTransactionsDashboardHelper([
            { groupid: "g1", groupname: "Food", categoryid: "c1", categoryname: "Dining", sum: -30 },
            { groupid: "g1", groupname: "Food", categoryid: "c2", categoryname: "Groceries", sum: -70 },
        ] as any);
        const food = groups.find((g) => g.id === "g1");
        expect(food?.y).toBe(100); // 30 + 70, absolute
        expect(categories.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
    });
});

describe("getStatsNetWorthGrowthHelper", () => {
    it("maps month -> label and total, defaulting null to 0", async () => {
        const out = await getStatsNetWorthGrowthHelper([
            { month: "2026-01-01", total_net_worth: 5000 },
            { month: "2026-02-01", total_net_worth: null },
        ] as any);
        expect(out).toEqual([
            { x: "Jan", y: 5000 },
            { x: "Feb", y: 0 },
        ]);
    });
});
