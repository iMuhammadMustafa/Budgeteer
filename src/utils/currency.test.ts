import { describe, expect, it } from "vitest";

import { DEFAULT_CURRENCY, formatMoney, getCurrency, getCurrencySymbol } from "./currency";

describe("getCurrency", () => {
    it("returns the matching currency by code", () => {
        expect(getCurrency("EUR")).toMatchObject({ code: "EUR", symbol: "€" });
    });

    it("is case-insensitive", () => {
        expect(getCurrency("gbp").code).toBe("GBP");
    });

    it.each([null, undefined, ""])("falls back to default for %s", (input) => {
        expect(getCurrency(input).code).toBe(DEFAULT_CURRENCY);
    });

    it("synthesizes an entry for unknown codes (uppercased code as name/symbol)", () => {
        expect(getCurrency("xyz")).toEqual({ code: "XYZ", name: "XYZ", symbol: "XYZ" });
    });
});

describe("getCurrencySymbol", () => {
    it("returns the symbol for a known code", () => {
        expect(getCurrencySymbol("JPY")).toBe("¥");
    });

    it("returns the uppercased code for an unknown one", () => {
        expect(getCurrencySymbol("abc")).toBe("ABC");
    });
});

describe("formatMoney", () => {
    it("formats a positive USD amount with two fraction digits", () => {
        // Assert on the numeric parts rather than exact glyph spacing, which
        // varies by ICU version across Node builds.
        const out = formatMoney(1234.5, "USD");
        expect(out).toContain("1,234.50");
        expect(out.startsWith("$")).toBe(true);
    });

    it("prefixes a minus sign for negative values", () => {
        expect(formatMoney(-5, "USD").startsWith("-")).toBe(true);
    });

    it("adds a plus sign only when signed option is set and value is positive", () => {
        expect(formatMoney(5, "USD", { signed: true }).startsWith("+")).toBe(true);
        expect(formatMoney(5, "USD").startsWith("+")).toBe(false);
    });

    it("does not sign zero", () => {
        const out = formatMoney(0, "USD", { signed: true });
        expect(out.startsWith("+")).toBe(false);
        expect(out.startsWith("-")).toBe(false);
    });

    it.each([null, undefined])("treats %s amount as zero", (input) => {
        expect(formatMoney(input, "USD")).toContain("0.00");
    });

    it("defaults to USD when no code is given", () => {
        expect(formatMoney(1, null).startsWith("$")).toBe(true);
    });

    it("falls back to manual formatting for an invalid currency code", () => {
        // A bogus 4-letter code makes Intl.NumberFormat throw → catch branch.
        const out = formatMoney(9.9, "ZZZZ");
        expect(out).toContain("9.90");
    });
});
