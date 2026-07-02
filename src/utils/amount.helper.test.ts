import { describe, expect, it } from "vitest";

import { formatAmountForInput, getAmountMode, parseAmountInput, roundToCents } from "./amount.helper";

describe("roundToCents", () => {
    it.each([
        [1.005, 1.0], // float drift: 1.005 * 100 is actually 100.49999...
        [0.1 + 0.2, 0.3],
        [2.675, 2.68], // *100 lands at/above 267.5 → rounds up (locks JS float behavior)
        [10, 10],
        [-3.456, -3.46],
        [1234567.891, 1234567.89],
    ])("rounds %d to %d", (input, expected) => {
        expect(roundToCents(input)).toBe(expected);
    });

    it.each([null, undefined, NaN, Infinity, -Infinity])("returns 0 for non-finite input %s", (input) => {
        expect(roundToCents(input as number)).toBe(0);
    });

    it("preserves negative zero", () => {
        expect(Object.is(roundToCents(-0), -0)).toBe(true);
    });
});

describe("getAmountMode", () => {
    it.each([
        [5, "plus"],
        [0, "plus"],
        [0.01, "plus"],
        [-1, "minus"],
        [-0.01, "minus"],
    ] as const)("classifies %d as %s", (input, expected) => {
        expect(getAmountMode(input)).toBe(expected);
    });

    it("treats -0 as minus (preserves user intent)", () => {
        expect(getAmountMode(-0)).toBe("minus");
    });

    it.each([null, undefined])("defaults null/undefined (%s) to minus", (input) => {
        expect(getAmountMode(input)).toBe("minus");
    });
});

describe("formatAmountForInput", () => {
    it.each([
        [null, ""],
        [undefined, ""],
        [0, ""],
        [12.5, "12.5"],
        [-99, "99"], // sign is stripped; mode carries direction
    ])("formats %s as %j", (input, expected) => {
        expect(formatAmountForInput(input as number)).toBe(expected);
    });

    // NOTE: the function's docstring says it treats -0 as "minus chosen, no digits yet"
    // (implying ""), but it actually returns "0" because the `!Object.is(amount, -0)`
    // guard only suppresses the plain-zero case. Locking current behavior; flagged as a
    // likely minor UI bug (see TESTING-STRATEGY findings).
    it("returns '0' for -0 (current behavior; docstring implies it should be '')", () => {
        expect(formatAmountForInput(-0)).toBe("0");
    });
});

describe("parseAmountInput", () => {
    it("parses a plain positive value", () => {
        expect(parseAmountInput("42.50", "plus")).toEqual({ amount: 42.5, mode: "plus", rawString: "42.50" });
    });

    it("flips to minus on a leading dash", () => {
        const r = parseAmountInput("-10", "plus");
        expect(r.amount).toBe(-10);
        expect(r.mode).toBe("minus");
    });

    it("respects allowNegativeFlip=false (fixed-sign types like Income/Transfer)", () => {
        const r = parseAmountInput("-10", "plus", { allowNegativeFlip: false });
        expect(r.mode).toBe("plus");
        expect(r.amount).toBe(10);
    });

    it("strips currency symbols and stray characters", () => {
        expect(parseAmountInput("$1,2a3", "plus").amount).toBe(123);
    });

    it("caps decimals to 2 places", () => {
        expect(parseAmountInput("1.239", "plus").rawString).toBe("1.23");
    });

    it("collapses repeated dots to a single decimal point", () => {
        expect(parseAmountInput("1..2", "plus").amount).toBe(1.2);
    });

    it("removes interior minus signs, keeping only a leading one", () => {
        const r = parseAmountInput("1-2", "plus");
        expect(r.amount).toBe(12);
    });

    it("strips leading zeros", () => {
        expect(parseAmountInput("007", "plus").rawString).toBe("7");
    });

    it("returns -0 for a bare minus in minus mode (user chose sign, no digits)", () => {
        const r = parseAmountInput("-", "plus");
        expect(r.mode).toBe("minus");
        expect(Object.is(r.amount, -0)).toBe(true);
    });

    it("treats empty input as 0", () => {
        expect(parseAmountInput("", "plus").amount).toBe(0);
    });
});
