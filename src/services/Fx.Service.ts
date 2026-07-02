import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { storage } from "@/src/utils/storageUtils";

type RatesPayload = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number; // unix ms
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cacheKey = (base: string) => `fx:rates:${base.toUpperCase()}`;

const PRIMARY_ENDPOINT = (base: string) =>
  `https://open.er-api.com/v6/latest/${base.toUpperCase()}`;
const FALLBACK_ENDPOINT = (base: string) =>
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`;

async function readCache(base: string): Promise<RatesPayload | null> {
  try {
    const raw = await storage.getItem(cacheKey(base));
    if (!raw) return null;
    return JSON.parse(raw) as RatesPayload;
  } catch {
    return null;
  }
}

async function writeCache(payload: RatesPayload): Promise<void> {
  try {
    await storage.setItem(cacheKey(payload.base), JSON.stringify(payload));
  } catch {
    // best-effort cache; non-fatal
  }
}

export async function fetchPrimary(base: string): Promise<RatesPayload> {
  const res = await fetch(PRIMARY_ENDPOINT(base));
  if (!res.ok) throw new Error(`fx primary http ${res.status}`);
  const json = await res.json();
  if (json?.result !== "success" || !json?.rates) {
    throw new Error(`fx primary bad payload`);
  }
  return { base: base.toUpperCase(), rates: json.rates, fetchedAt: Date.now() };
}

export async function fetchFallback(base: string): Promise<RatesPayload> {
  const res = await fetch(FALLBACK_ENDPOINT(base));
  if (!res.ok) throw new Error(`fx fallback http ${res.status}`);
  const json = await res.json();
  const lower = base.toLowerCase();
  const ratesLower: Record<string, number> | undefined = json?.[lower];
  if (!ratesLower) throw new Error(`fx fallback bad payload`);
  const rates: Record<string, number> = {};
  for (const [k, v] of Object.entries(ratesLower)) {
    rates[k.toUpperCase()] = v as number;
  }
  return { base: base.toUpperCase(), rates, fetchedAt: Date.now() };
}

export async function loadRates(base: string): Promise<RatesPayload> {
  const baseUpper = base.toUpperCase();
  const cached = await readCache(baseUpper);
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  if (fresh) return cached;

  try {
    const payload = await fetchPrimary(baseUpper);
    await writeCache(payload);
    return payload;
  } catch (primaryErr) {
    try {
      const payload = await fetchFallback(baseUpper);
      await writeCache(payload);
      return payload;
    } catch (fallbackErr) {
      if (cached) return cached;
      console.warn("[Fx] both providers failed, no cache; returning identity rates", {
        primaryErr,
        fallbackErr,
      });
      return { base: baseUpper, rates: { [baseUpper]: 1 }, fetchedAt: Date.now() };
    }
  }
}

export function useRates(base: string | null | undefined) {
  const effectiveBase = (base ?? "USD").toUpperCase();
  return useQuery({
    queryKey: ["fx-rates", effectiveBase],
    queryFn: () => loadRates(effectiveBase),
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS,
    enabled: !!effectiveBase,
  });
}

export function useExchangeRate(from: string | null | undefined, to: string | null | undefined) {
  const fromUpper = (from ?? "USD").toUpperCase();
  const toUpper = (to ?? "USD").toUpperCase();
  const { data, isLoading, error } = useRates(fromUpper);

  const rate = (() => {
    if (fromUpper === toUpper) return 1;
    const direct = data?.rates?.[toUpper];
    if (typeof direct === "number" && direct > 0) return direct;
    return null;
  })();

  return { rate, isLoading, error, ratesFetchedAt: data?.fetchedAt };
}

export function useConverter() {
  const convert = useCallback(
    async (amount: number, from: string, to: string): Promise<number> => {
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();
      if (fromUpper === toUpper) return amount;
      const payload = await loadRates(fromUpper);
      const rate = payload.rates?.[toUpper];
      if (!rate || rate <= 0) return amount;
      return amount * rate;
    },
    [],
  );
  return convert;
}
