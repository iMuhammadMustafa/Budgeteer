import { describe, expect, it } from "vitest";

import { toBarData, toDonutData, toDoubleBar, toHeatmap, toLineData } from "./chartAdapters";

describe("toBarData", () => {
    it("maps {x,y,color} to {label,value,color}", () => {
        expect(toBarData([{ x: "Jan", y: 10, color: "red" }] as any)).toEqual([{ label: "Jan", value: 10, color: "red" }]);
    });
    it("defaults undefined input to an empty array", () => {
        expect(toBarData()).toEqual([]);
    });
});

describe("toLineData / toDonutData", () => {
    it("map {x,y} to {label,value}", () => {
        expect(toLineData([{ x: "A", y: 1 }] as any)).toEqual([{ label: "A", value: 1 }]);
        expect(toDonutData([{ x: "A", y: 1 }] as any)).toEqual([{ label: "A", value: 1 }]);
    });
    it("handle empty input", () => {
        expect(toLineData()).toEqual([]);
        expect(toDonutData()).toEqual([]);
    });
});

describe("toDoubleBar", () => {
    it("splits into income/expense and reads labels/colors from the first datum", () => {
        const out = toDoubleBar([
            { x: "Jan", barOne: { value: 100, label: "In", color: "green" }, barTwo: { value: 40, label: "Out", color: "red" } },
        ] as any);
        expect(out.data).toEqual([{ label: "Jan", income: 100, expense: 40 }]);
        expect(out).toMatchObject({ bar1Label: "In", bar2Label: "Out", bar1Color: "green", bar2Color: "red" });
    });
    it("falls back to Income/Expense labels when empty", () => {
        const out = toDoubleBar();
        expect(out.data).toEqual([]);
        expect(out).toMatchObject({ bar1Label: "Income", bar2Label: "Expense" });
    });
});

describe("toHeatmap", () => {
    it("passes calendar data through unchanged", () => {
        const data = { "2026-01-01": { dots: [{ key: "k", color: "c" }] } } as any;
        expect(toHeatmap(data)).toBe(data);
    });
    it("defaults to an empty object", () => {
        expect(toHeatmap()).toEqual({});
    });
});
