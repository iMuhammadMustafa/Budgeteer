import { describe, expect, it, vi } from "vitest";
import {
    createAmountValidation,
    createDescriptionValidation,
    createRecurringValidation,
    emailValidator,
    executeValidationRule,
    formatValidationError,
    getFirstValidationError,
    hasValidationErrors,
    maxLengthValidator,
    maxValidator,
    minLengthValidator,
    minValidator,
    numericStringValidator,
    patternValidator,
    positiveAmountValidator,
    requiredValidator,
    safeStringValidator,
    validateField,
    validateForm,
} from "./form-validation";

// form-validation.ts imports `RecurringType` from Recurrings.Service, which
// transitively pulls in the entire provider/React-Query graph (native modules).
// Stub just the enum so this pure-logic file loads in Node. (Coupling flagged in
// TESTING-STRATEGY findings — RecurringType ideally lives in a types module.)
vi.mock("@/src/services/Recurrings.Service", () => ({
    RecurringType: { Standard: "Standard", Transfer: "Transfer", CreditCardPayment: "CreditCardPayment" },
}));

describe("requiredValidator", () => {
    it.each([
        ["non-empty string", "x", true],
        ["whitespace-only string", "   ", false],
        ["empty string", "", false],
        ["zero", 0, true],
        ["false", false, true],
        ["null", null, false],
        ["undefined", undefined, false],
        ["non-empty array", [1], true],
        ["empty array", [], false],
    ])("%s -> %s", (_label, value, expected) => {
        expect(requiredValidator(value)).toBe(expected);
    });
});

describe("length validators (empty passes; required handles emptiness)", () => {
    it("minLength", () => {
        expect(minLengthValidator("ab", 2)).toBe(true);
        expect(minLengthValidator("a", 2)).toBe(false);
        expect(minLengthValidator("", 2)).toBe(true);
    });
    it("maxLength", () => {
        expect(maxLengthValidator("ab", 2)).toBe(true);
        expect(maxLengthValidator("abc", 2)).toBe(false);
        expect(maxLengthValidator("", 2)).toBe(true);
    });
});

describe("numeric range validators (null/undefined pass)", () => {
    it("min", () => {
        expect(minValidator(5, 1)).toBe(true);
        expect(minValidator(0, 1)).toBe(false);
        expect(minValidator(null as unknown as number, 1)).toBe(true);
    });
    it("max", () => {
        expect(maxValidator(5, 10)).toBe(true);
        expect(maxValidator(11, 10)).toBe(false);
        expect(maxValidator(undefined as unknown as number, 10)).toBe(true);
    });
});

describe("patternValidator", () => {
    it("tests against the regex, empty passes", () => {
        expect(patternValidator("abc", /^[a-z]+$/)).toBe(true);
        expect(patternValidator("ab1", /^[a-z]+$/)).toBe(false);
        expect(patternValidator("", /^[a-z]+$/)).toBe(true);
    });
});

describe("emailValidator", () => {
    it.each([
        ["a@b.co", true],
        ["first.last@sub.example.com", true],
        ["", true], // empty passes; required handles it
        ["no-at", false],
        ["a@b", false],
        ["a@@b.co", false],
        ["a..b@c.co", false], // consecutive dots rejected
        ["a b@c.co", false], // space
    ])("%j -> %s", (value, expected) => {
        expect(emailValidator(value as string)).toBe(expected);
    });
});

describe("positiveAmountValidator", () => {
    it.each([
        [1, true],
        [0.01, true],
        [0, false],
        [-1, false],
    ])("%d -> %s", (value, expected) => {
        expect(positiveAmountValidator(value)).toBe(expected);
    });
});

describe("safeStringValidator", () => {
    it.each([
        ["Groceries", true],
        ["Rent - March (2024)", true],
        ["", true],
        ["<script>", false], // angle brackets
        ["line\nbreak", false], // newline
        ["tab\there", false],
        ["emoji 🎉", false], // outside allowed set
    ])("%j -> %s", (value, expected) => {
        expect(safeStringValidator(value as string)).toBe(expected);
    });
});

describe("numericStringValidator", () => {
    it.each([
        ["123", true],
        ["-12.34", true],
        ["", true],
        ["1e5", false], // scientific notation rejected
        ["Infinity", false],
        ["NaN", false],
        ["1.2.3", false],
        ["1 2", false], // whitespace
        ["abc", false],
    ])("%j -> %s", (value, expected) => {
        expect(numericStringValidator(value as string)).toBe(expected);
    });
});

describe("executeValidationRule", () => {
    it("returns the rule message on failure", () => {
        const r = executeValidationRule({ type: "required", message: "req!" }, "");
        expect(r).toEqual({ isValid: false, error: "req!" });
    });
    it("returns no error on success", () => {
        expect(executeValidationRule({ type: "required", message: "req!" }, "x")).toEqual({
            isValid: true,
            error: undefined,
        });
    });
    it("runs custom validators with formData", () => {
        const rule = {
            type: "custom" as const,
            message: "mismatch",
            validator: (v: any, form: any) => v === form?.other,
        };
        expect(executeValidationRule(rule, "a", { other: "a" }).isValid).toBe(true);
        expect(executeValidationRule(rule, "a", { other: "b" }).isValid).toBe(false);
    });
    it("passes unknown rule types (fails open)", () => {
        expect(executeValidationRule({ type: "bogus" as any, message: "x" }, "anything").isValid).toBe(true);
    });
});

describe("validateField", () => {
    it("returns the first failing rule's result", () => {
        const rules = [
            { type: "required" as const, message: "required" },
            { type: "minLength" as const, value: 3, message: "too short" },
        ];
        expect(validateField("name", "", rules).error).toBe("required");
        expect(validateField("name", "ab", rules).error).toBe("too short");
        expect(validateField("name", "abc", rules).isValid).toBe(true);
    });
});

describe("validateForm", () => {
    it("aggregates errors across fields", () => {
        const schema = {
            name: [{ type: "required" as const, message: "name required" }],
            amount: [{ type: "min" as const, value: 1, message: "too small" }],
        };
        const result = validateForm({ name: "", amount: 0 }, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({ name: "name required", amount: "too small" });
    });
    it("is valid when all fields pass", () => {
        const schema = { name: [{ type: "required" as const, message: "x" }] };
        expect(validateForm({ name: "ok" }, schema).isValid).toBe(true);
    });
});

describe("schema builders", () => {
    it("createAmountValidation rejects 0 and oversized amounts", () => {
        const rules = createAmountValidation();
        expect(validateField("amount", 0, rules).isValid).toBe(false);
        expect(validateField("amount", 5, rules).isValid).toBe(true);
        expect(validateField("amount", 1e12, rules).isValid).toBe(false);
    });
    it("createDescriptionValidation is optional unless required=true", () => {
        expect(validateField("d", "", createDescriptionValidation()).isValid).toBe(true);
        expect(validateField("d", "", createDescriptionValidation(true)).isValid).toBe(false);
    });
});

describe("createRecurringValidation", () => {
    const rules = createRecurringValidation();
    const check = (form: any) => validateField("x", undefined, rules, form);

    it("accepts a valid standard recurring", () => {
        expect(check({ recurringtype: "Standard", categoryid: "c1", amount: 10, nextoccurrencedate: "2026-01-01" }).isValid).toBe(true);
    });
    it("requires a transfer account for transfers", () => {
        const r = check({ recurringtype: "Transfer", categoryid: "c1", amount: 10, nextoccurrencedate: "2026-01-01" });
        expect(r.error).toBe("Transfer account is required for transfers");
    });
    it("rejects same source and transfer account", () => {
        const r = check({
            recurringtype: "Transfer",
            transferaccountid: "a1",
            sourceaccountid: "a1",
            categoryid: "c1",
            amount: 10,
            nextoccurrencedate: "2026-01-01",
        });
        expect(r.error).toBe("Source account and transfer account must be different");
    });
    it("requires a category", () => {
        expect(check({ recurringtype: "Standard", amount: 10, nextoccurrencedate: "2026-01-01" }).error).toBe(
            "Category is required for credit card payments",
        );
    });
    it("allows a flexible amount to omit the amount", () => {
        expect(check({ recurringtype: "Standard", categoryid: "c1", isamountflexible: true, nextoccurrencedate: "2026-01-01" }).isValid).toBe(true);
    });
    it("rejects interval months outside 1..24", () => {
        expect(validateField("intervalmonths" as any, 25, rules, { recurringtype: "Standard", categoryid: "c1", amount: 1, nextoccurrencedate: "2026-01-01" }).error).toBe(
            "Interval months must be between 1 and 24",
        );
    });
});

describe("error helpers", () => {
    it("formatValidationError capitalizes", () => {
        expect(formatValidationError("must be positive")).toBe("Must be positive");
    });
    it("hasValidationErrors ignores undefined/empty", () => {
        expect(hasValidationErrors({ a: undefined, b: "" })).toBe(false);
        expect(hasValidationErrors({ a: "err" })).toBe(true);
    });
    it("getFirstValidationError returns first truthy", () => {
        expect(getFirstValidationError({ a: undefined, b: "second" })).toBe("second");
        expect(getFirstValidationError({ a: undefined })).toBeUndefined();
    });
});
