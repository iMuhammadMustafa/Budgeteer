/**
 * CloudSyncProvider — realtime cache invalidation for Cloud mode.
 *
 * Subscribes to Postgres change events on the five user-data tables via a single
 * Supabase Realtime channel and, on each burst of changes, invalidates the
 * matching TanStack Query keys so the UI reflects external mutations (a second
 * device, another tab, the Supabase SQL editor) without a manual refresh.
 *
 * Only active in Cloud mode with a live session. Local/Demo modes are
 * single-device SQLite and need no sync — the provider renders children and does
 * nothing there. The channel is torn down on unmount, mode switch, and logout so
 * no subscription outlives its provider (a memory-leak class we avoid).
 */
import { PropsWithChildren, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { StorageMode } from "@/src/types/StorageMode";
import { TableNames } from "@/src/types/database/TableNames";
import { useAuth } from "./AuthProvider";
import { queryClient } from "./QueryProvider";
import { useStorageMode } from "./StorageModeProvider";
import supabase from "./Supabase";
import { queryKeys } from "@/src/services/queryKeys";

const CHANNEL_NAME = "db-sync";
const DEBOUNCE_MS = 250;

/** Tables we listen to. All carry a `tenantid` column for client-side scoping. */
const WATCHED_TABLES: readonly string[] = [
  TableNames.Transactions,
  TableNames.TransactionItems,
  TableNames.Accounts,
  TableNames.TransactionCategories,
  TableNames.TransactionGroups,
];

/**
 * Map a changed table to the query-key prefixes that must be invalidated.
 * Transactions touch account balances and every stats view; category/group
 * edits ripple into the transactions view (it denormalizes their names).
 */
function keysForTable(table: string): readonly (readonly unknown[])[] {
  switch (table) {
    case TableNames.Transactions:
      return [
        queryKeys.transactions.all,
        queryKeys.transactions.viewAll,
        queryKeys.accounts.all,
        queryKeys.stats.dailyAll,
        queryKeys.stats.monthlyTypesAll,
        queryKeys.stats.monthlyCategoriesAll,
        queryKeys.stats.monthlyAccountsAll,
        queryKeys.stats.netWorthAll,
      ];
    case TableNames.TransactionItems:
      return [queryKeys.transactionItems.all, queryKeys.transactions.all, queryKeys.transactions.viewAll];
    case TableNames.Accounts:
      return [
        queryKeys.accounts.all,
        queryKeys.transactions.all,
        queryKeys.transactions.viewAll,
        queryKeys.stats.monthlyAccountsAll,
        queryKeys.stats.netWorthAll,
      ];
    case TableNames.TransactionCategories:
      return [
        queryKeys.transactionCategories.all,
        queryKeys.transactions.viewAll,
        queryKeys.stats.monthlyCategoriesAll,
      ];
    case TableNames.TransactionGroups:
      return [queryKeys.transactionGroups.all, queryKeys.transactionCategories.all];
    default:
      return [];
  }
}

export default function CloudSyncProvider({ children }: PropsWithChildren) {
  const { storageMode } = useStorageMode();
  const { session } = useAuth();
  const tenantId: string | undefined = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;

  // Tables changed since the last flush; drained on the debounced invalidation.
  const pendingTables = useRef<Set<string>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only Cloud mode with an authenticated tenant needs realtime sync.
    if (storageMode !== StorageMode.Cloud || !session || !tenantId) return;

    // Capture the ref locally so the cleanup closure operates on this effect's
    // Set instance (the ref object itself is stable for the component's life).
    const pending = pendingTables.current;

    const flush = () => {
      flushTimer.current = null;
      const tables = Array.from(pending);
      pending.clear();

      // Dedupe the union of prefixes (many tables share e.g. transactions.viewAll)
      // so each distinct prefix is invalidated once per burst.
      const seen = new Map<string, readonly unknown[]>();
      for (const table of tables) {
        for (const key of keysForTable(table)) {
          seen.set(JSON.stringify(key), key);
        }
      }
      for (const key of seen.values()) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    const scheduleFlush = () => {
      if (flushTimer.current) return;
      flushTimer.current = setTimeout(flush, DEBOUNCE_MS);
    };

    const channel: RealtimeChannel = supabase.channel(CHANNEL_NAME);

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: { table: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
          // Publication is not tenant-filtered; scope client-side so a change
          // from another tenant (should RLS ever allow it) can't invalidate us.
          const rowTenant = (payload.new?.tenantid ?? payload.old?.tenantid) as string | undefined;
          if (rowTenant !== undefined && rowTenant !== tenantId) return;
          pending.add(payload.table);
          scheduleFlush();
        },
      );
    }

    channel.subscribe(status => {
      if (__DEV__) console.log(`[CloudSync] channel ${status}`);
    });

    return () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      pending.clear();
      supabase.removeChannel(channel);
    };
    // Re-subscribe when the active tenant/session changes (login/logout) or the
    // storage mode switches; the cleanup above tears the old channel down first.
  }, [storageMode, session, tenantId, userId]);

  return <>{children}</>;
}
