import { describe, expect, it, vi } from "vitest";

import type { FormError } from "../types/components/forms.types";
import {
    convertApiErrorToFormError,
    convertFormErrorsToValidationErrors,
    convertValidationErrorsToFormErrors,
    createFormErrorState,
    createNetworkError,
    createServerError,
    createValidationError,
    formatErrorMessage,
    getMostCriticalError,
    getRetryDelay,
    getUserFriendlyErrorMessage,
    groupErrorsByType,
    hasCriticalErrors,
    isRecoverableError,
    updateErrorState,
} from "./form-errors";

describe("createFormErrorState", () => {
    it("adds, reads, and clears field errors", () => {
        const state = createFormErrorState();
        state.addError(createValidationError("name", "required"));
        expect(state.getFieldError("name")).toBe("required");
        state.clearFieldError("name");
        expect(state.getFieldError("name")).toBeUndefined();
    });
    it("replaces an existing error for the same field", () => {
        const state = createFormErrorState();
        state.addError(createValidationError("name", "first"));
        state.addError(createValidationError("name", "second"));
        expect(state.errors).toHaveLength(1);
        expect(state.getFieldError("name")).toBe("second");
    });
    it("getFormErrors returns only field-less errors", () => {
        const state = createFormErrorState();
        state.addError(createValidationError("name", "req"));
        state.addError(createNetworkError());
        expect(state.getFormErrors()).toHaveLength(1);
        expect(state.getFormErrors()[0].type).toBe("network");
    });
});

describe("updateErrorState", () => {
    it("recomputes hasErrors from the errors array", () => {
        expect(updateErrorState({ errors: [], hasErrors: true } as any).hasErrors).toBe(false);
        expect(updateErrorState({ errors: [createNetworkError()], hasErrors: false } as any).hasErrors).toBe(true);
    });
});

describe("formatErrorMessage", () => {
    it.each([
        [createValidationError("f", "bad input"), "Bad input"],
        [{ message: "down", type: "network" } as FormError, "Network error: Down"],
        [{ message: "oops", type: "submission" } as FormError, "Submission failed: Oops"],
        [{ message: "boom", type: "server", code: "500" } as FormError, "Server error (500): Boom"],
        [{ message: "boom", type: "server" } as FormError, "Server error: Boom"],
    ])("formats %o", (error, expected) => {
        expect(formatErrorMessage(error)).toBe(expected);
    });
});

describe("getUserFriendlyErrorMessage", () => {
    it.each([
        ["network failure", "connect"],
        ["Request timeout", "too long"],
        ["validation failed", "check your input"],
        ["unauthorized", "permission"],
        ["500 server error", "server error"],
        ["not found", "was not found"],
        ["something weird", "unexpected error"],
    ])("maps %j to a friendly message containing %j", (input, fragment) => {
        expect(getUserFriendlyErrorMessage(input).toLowerCase()).toContain(fragment);
    });
    it("accepts Error objects", () => {
        expect(getUserFriendlyErrorMessage(new Error("network down")).toLowerCase()).toContain("connect");
    });
});

describe("isRecoverableError", () => {
    it.each([
        [{ message: "", type: "network" } as FormError, true],
        [{ message: "", type: "submission" } as FormError, true],
        [{ message: "", type: "validation" } as FormError, false],
        [{ message: "", type: "server", code: "503" } as FormError, true],
        [{ message: "", type: "server", code: "400" } as FormError, false],
        [{ message: "", type: "server" } as FormError, true],
    ])("classifies %o", (error, expected) => {
        expect(isRecoverableError(error)).toBe(expected);
    });
});

describe("getRetryDelay", () => {
    it("uses exponential backoff for network errors, capped at 30s", () => {
        const net = { message: "", type: "network" } as FormError;
        expect(getRetryDelay(net, 1)).toBe(1000);
        expect(getRetryDelay(net, 2)).toBe(2000);
        expect(getRetryDelay(net, 3)).toBe(4000);
        expect(getRetryDelay(net, 20)).toBe(30000); // capped
    });
    it("uses linear backoff for server errors", () => {
        const srv = { message: "", type: "server" } as FormError;
        expect(getRetryDelay(srv, 3)).toBe(3000);
    });
    it("uses base delay for other types", () => {
        expect(getRetryDelay({ message: "", type: "validation" } as FormError, 5)).toBe(1000);
    });
});

describe("error conversions", () => {
    it("convertApiErrorToFormError handles strings, objects, and field errors", () => {
        expect(convertApiErrorToFormError("boom")).toMatchObject({ type: "server", message: "boom" });
        expect(convertApiErrorToFormError({ message: "m", code: "500" })).toMatchObject({ code: "500" });
        expect(convertApiErrorToFormError({ message: "m", field: "email" })).toMatchObject({ field: "email", type: "server" });
        expect(convertApiErrorToFormError(null)).toMatchObject({ message: "Unknown server error" });
    });
    it("round-trips validation errors <-> form errors", () => {
        const forms = convertValidationErrorsToFormErrors({ name: "required", amount: "too small" });
        expect(forms).toHaveLength(2);
        expect(forms.every(f => f.type === "validation")).toBe(true);
        const back = convertFormErrorsToValidationErrors(forms);
        expect(back).toEqual({ name: "required", amount: "too small" });
    });
    it("convertFormErrorsToValidationErrors ignores non-validation and field-less errors", () => {
        const errs: FormError[] = [createNetworkError(), createServerError("x", "500")];
        expect(convertFormErrorsToValidationErrors(errs)).toEqual({});
    });
});

describe("aggregation", () => {
    const errs: FormError[] = [
        createValidationError("a", "v"),
        createNetworkError(),
        createServerError("s", "500"),
    ];
    it("groupErrorsByType buckets every error", () => {
        const g = groupErrorsByType(errs);
        expect(g.validation).toHaveLength(1);
        expect(g.network).toHaveLength(1);
        expect(g.server).toHaveLength(1);
        expect(g.submission).toHaveLength(0);
    });
    it("getMostCriticalError follows server > network > submission > validation", () => {
        expect(getMostCriticalError(errs)?.type).toBe("server");
        expect(getMostCriticalError([createValidationError("a", "v"), createNetworkError()])?.type).toBe("network");
        expect(getMostCriticalError([])).toBeNull();
    });
    it("hasCriticalErrors is true only with validation errors", () => {
        expect(hasCriticalErrors(errs)).toBe(true);
        expect(hasCriticalErrors([createNetworkError()])).toBe(false);
    });
});

describe("logging helpers do not throw", () => {
    it("logFormError / reportFormError are safe", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const { logFormError, reportFormError } = await import("./form-errors");
        expect(() => logFormError(createNetworkError(), "ctx")).not.toThrow();
        expect(() => reportFormError(createNetworkError())).not.toThrow();
        spy.mockRestore();
    });
});
