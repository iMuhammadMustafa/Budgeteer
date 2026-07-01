/**
 * useRecentValues — a tiny most-recently-used store for form quick-picks (icons,
 * colors, category ids, …). Local-only and storage-mode-agnostic: it persists to
 * `storage` (localStorage on web, AsyncStorage on native), so it works identically
 * in Cloud / Local / Demo modes and never touches the backend.
 *
 *   const { recent, record } = useRecentValues("account:icon");
 *   // recent → ["Wallet", "PiggyBank", …] (most-recent first, deduped, capped)
 *   record("CreditCard"); // moves it to the front, persists
 *
 * Keys are namespaced by caller (e.g. `account:icon`). The hook seeds `recent`
 * from storage on mount; callers merge in derived defaults (values already used by
 * existing entities) via `mergeRecents` for the "both" behavior.
 */
import { useCallback, useEffect, useState } from "react";

import { storage } from "@/src/utils/storageUtils";

const PREFIX = "recent:";
const DEFAULT_MAX = 8;

export function useRecentValues(key: string, max: number = DEFAULT_MAX) {
  const storageKey = `${PREFIX}${key}`;
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    storage
      .getItem(storageKey)
      .then(raw => {
        if (!active || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecent(parsed.filter((v): v is string => typeof v === "string").slice(0, max));
          }
        } catch {
          // corrupt value — ignore
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [storageKey, max]);

  const record = useCallback(
    (value: string | null | undefined) => {
      if (!value) return;
      setRecent(prev => {
        const next = [value, ...prev.filter(v => v !== value)].slice(0, max);
        storage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [storageKey, max],
  );

  return { recent, record };
}

/**
 * Merge persisted recents with values derived from existing entities (the "both"
 * source). Recents win order; derived values fill the tail. Deduped, capped.
 */
export function mergeRecents(recent: string[], derived: (string | null | undefined)[], max: number = DEFAULT_MAX): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of [...recent, ...derived]) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}
