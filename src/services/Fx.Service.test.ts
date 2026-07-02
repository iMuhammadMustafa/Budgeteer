import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// storageUtils imports AsyncStorage + react-native; back it with an in-memory store.
const { store } = vi.hoisted(() => ({ store: new Map<string, string>() }));
vi.mock("@/src/utils/storageUtils", () => ({
    storage: {
        getItem: async (k: string) => store.get(k) ?? null,
        setItem: async (k: string, v: string) => void store.set(k, v),
        removeItem: async (k: string) => void store.delete(k),
    },
}));

import { fetchFallback, fetchPrimary, loadRates } from "./Fx.Service";

const okJson = (body: any) => ({ ok: true, status: 200, json: async () => body });
const httpErr = (status: number) => ({ ok: false, status, json: async () => ({}) });

beforeEach(() => {
    store.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("fetchPrimary", () => {
    it("returns normalized rates on a successful payload", async () => {
        (fetch as any).mockResolvedValueOnce(okJson({ result: "success", rates: { USD: 1, EUR: 0.9 } }));
        const p = await fetchPrimary("USD");
        expect(p).toMatchObject({ base: "USD", rates: { EUR: 0.9 } });
    });
    it("throws on an http error", async () => {
        (fetch as any).mockResolvedValueOnce(httpErr(500));
        await expect(fetchPrimary("USD")).rejects.toThrow(/http 500/);
    });
    it("throws on a bad payload (no success / no rates)", async () => {
        (fetch as any).mockResolvedValueOnce(okJson({ result: "error" }));
        await expect(fetchPrimary("USD")).rejects.toThrow(/bad payload/);
    });
});

describe("fetchFallback", () => {
    it("uppercases the nested currency map", async () => {
        (fetch as any).mockResolvedValueOnce(okJson({ usd: { eur: 0.9, gbp: 0.8 } }));
        const p = await fetchFallback("USD");
        expect(p.rates).toEqual({ EUR: 0.9, GBP: 0.8 });
    });
    it("throws when the base key is absent", async () => {
        (fetch as any).mockResolvedValueOnce(okJson({ somethingElse: {} }));
        await expect(fetchFallback("USD")).rejects.toThrow(/bad payload/);
    });
});

describe("loadRates", () => {
    it("serves a fresh cache without hitting the network", async () => {
        store.set("fx:rates:USD", JSON.stringify({ base: "USD", rates: { EUR: 0.5 }, fetchedAt: Date.now() }));
        const p = await loadRates("USD");
        expect(p.rates.EUR).toBe(0.5);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("refetches when the cache is older than the 24h TTL", async () => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000 + 1);
        store.set("fx:rates:USD", JSON.stringify({ base: "USD", rates: { EUR: 0.5 }, fetchedAt: dayAgo }));
        (fetch as any).mockResolvedValueOnce(okJson({ result: "success", rates: { EUR: 0.9 } }));
        const p = await loadRates("USD");
        expect(p.rates.EUR).toBe(0.9);
        expect(store.get("fx:rates:USD")).toContain("0.9"); // cache refreshed
    });

    it("falls back to the secondary provider when primary fails", async () => {
        (fetch as any)
            .mockResolvedValueOnce(httpErr(503)) // primary
            .mockResolvedValueOnce(okJson({ usd: { eur: 0.91 } })); // fallback
        const p = await loadRates("USD");
        expect(p.rates.EUR).toBe(0.91);
    });

    it("returns a stale cache when both providers fail", async () => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000 + 1);
        store.set("fx:rates:USD", JSON.stringify({ base: "USD", rates: { EUR: 0.42 }, fetchedAt: dayAgo }));
        (fetch as any).mockResolvedValue(httpErr(500));
        const p = await loadRates("USD");
        expect(p.rates.EUR).toBe(0.42);
    });

    it("returns identity rates when both providers fail and there is no cache", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        (fetch as any).mockResolvedValue(httpErr(500));
        const p = await loadRates("USD");
        expect(p.rates).toEqual({ USD: 1 });
    });
});
