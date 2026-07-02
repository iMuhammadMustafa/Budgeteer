import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncedValidator, debounce, throttle } from "./debounce";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("debounce", () => {
    it("fires once after the delay with the latest args", () => {
        const fn = vi.fn();
        const d = debounce(fn, 100);
        d("a");
        d("b");
        d("c");
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenLastCalledWith("c");
    });
    it("resets the timer on each call", () => {
        const fn = vi.fn();
        const d = debounce(fn, 100);
        d();
        vi.advanceTimersByTime(60);
        d(); // resets
        vi.advanceTimersByTime(60);
        expect(fn).not.toHaveBeenCalled(); // 120ms elapsed but only 60 since last call
        vi.advanceTimersByTime(40);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe("throttle", () => {
    it("invokes immediately on the first call", () => {
        const fn = vi.fn();
        const t = throttle(fn, 100);
        t("first");
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenLastCalledWith("first");
    });
    it("schedules a trailing call for invocations inside the interval", () => {
        const fn = vi.fn();
        const t = throttle(fn, 100);
        t("a"); // immediate
        t("b"); // scheduled
        expect(fn).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith("b");
    });
});

describe("createDebouncedValidator", () => {
    it("resolves with the validator result after the delay", async () => {
        const validator = vi.fn(async (v: number) => v > 0);
        const debounced = createDebouncedValidator(validator, 50);
        const p = debounced(5);
        await vi.advanceTimersByTimeAsync(50);
        await expect(p).resolves.toBe(true);
    });
    it("resolves false when the validator throws", async () => {
        const validator = vi.fn(async () => {
            throw new Error("boom");
        });
        const debounced = createDebouncedValidator(validator, 50);
        const p = debounced("x");
        await vi.advanceTimersByTimeAsync(50);
        await expect(p).resolves.toBe(false);
    });
});
