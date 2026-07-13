import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "vitest";
import {
    getStatsDailyTransactionsHelper,
    getStatsMonthlyCategoriesTransactionsDashboardHelper,
    getStatsMonthlyTransactionsTypesHelper,
    getStatsNetWorthGrowthHelper,
} from "./stats.helpers";

// The app enables the dayjs utc plugin globally (dayjs.extend(utc) in
// src/app/_layout.tsx); replicate here so parsing/formatting matches the app.
dayjs.extend(utc);

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

    it("buckets rows onto the correct calendar day and zero-fills the rest (no false 'Today')", () => {
        const { barsData } = getStatsDailyTransactionsHelper(
            [{ date: "2026-01-07", type: "Expense", sum: -40 }] as any,
            true,
            "2026-01-07", // a Wednesday, not the real current day
        );
        expect(barsData).toHaveLength(7);
        // Sunday-based week of 2026-01-07 is 2026-01-04..2026-01-10, so Wed is index 3.
        expect(barsData![3]).toMatchObject({ x: "Wed", y: 40 }); // absolute value, correct day
        // A base that isn't today must not fabricate a "Today" marker.
        expect(barsData!.some((b) => b.x === "Today")).toBe(false);
        expect(barsData!.filter((b) => b.y === 0)).toHaveLength(6);
        // Every slot carries its real date so an empty-day bar can still drill into details.
        expect(barsData!.every((b) => typeof b.item?.date === "string")).toBe(true);
    });

    it("marks only the real current day as 'Today'", () => {
        const todayKey = dayjs().format("YYYY-MM-DD");
        const { barsData } = getStatsDailyTransactionsHelper(
            [{ date: todayKey, type: "Expense", sum: -25 }] as any,
            true,
            dayjs().toISOString(),
        );
        const today = barsData!.filter((b) => b.x === "Today");
        expect(today).toHaveLength(1);
        expect(today[0].y).toBe(25);
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
