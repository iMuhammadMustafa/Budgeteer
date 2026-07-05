/**
 * Centralized TanStack Query key factory.
 *
 * Every `queryKey` and every `invalidateQueries` call in the app funnels through
 * here so keys have a single source of truth, structurally-equal filters hit the
 * same cache entry, and invalidation targets the narrowest correct prefix.
 *
 * Key SHAPES are intentionally identical to the hand-built arrays they replaced
 * (same element order) so that broad prefix invalidations — e.g. invalidating
 * `[TableNames.Accounts]` to catch every account-scoped query — keep working.
 * TanStack matches a query when the invalidation key is a prefix of it.
 */
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";

/**
 * Produce a stable, structurally-comparable value from a filters object: drop
 * `undefined` entries and sort keys so filters that are equal-but-for-order (or
 * that differ only by an explicit `undefined`) hash to the same cache entry.
 * TanStack already sorts object keys when hashing, but normalizing here makes
 * the stored key predictable and collapses the `{a: undefined}` vs `{}` case.
 */
export function normalizeFilters(filters?: Record<string, unknown> | null): Record<string, unknown> {
  if (!filters) return {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Generic per-table key set backing BaseService's generic hooks. Mirrors the
 * legacy `[table]` / `[table, tenantId, filters]` / `[table, "deleted", tenantId]`
 * / `[table, id, tenantId]` shapes exactly.
 */
export function entityKeys(table: TableNames | ViewNames) {
  return {
    all: [table] as const,
    list: (tenantId?: string, filters?: unknown) =>
      [table, tenantId, normalizeFilters(filters as Record<string, unknown> | null | undefined)] as const,
    deleted: (tenantId?: string) => [table, "deleted", tenantId] as const,
    detail: (id?: string, tenantId?: string) => [table, id, tenantId] as const,
  };
}

export const queryKeys = {
  accounts: {
    ...entityKeys(TableNames.Accounts),
    withCategory: (tenantId?: string, isDeleted?: boolean) =>
      [TableNames.Accounts, "WithCategory", tenantId, isDeleted] as const,
    totalBalance: (tenantId?: string) => [TableNames.Accounts, "TotalBalance", tenantId] as const,
    /**
     * With `tenantId` → the exact query key used by `useGetAccountRunningBalance`
     * (and the narrow post-upsert invalidation). Without it → a prefix that
     * matches every tenant's running-balance query for the account.
     */
    runningBalance: (id?: string, tenantId?: string): readonly (string | undefined)[] =>
      tenantId !== undefined
        ? [TableNames.Accounts, id, "RunningBalance", tenantId]
        : [TableNames.Accounts, id, "RunningBalance"],
  },

  accountCategories: {
    ...entityKeys(TableNames.AccountCategories),
  },

  transactions: {
    ...entityKeys(TableNames.Transactions),
    /** Prefix matching every `transactionsview` query (list, infinite, filtered). */
    viewAll: [ViewNames.TransactionsView] as const,
    view: (filters?: TransactionFilters, tenantId?: string) =>
      [ViewNames.TransactionsView, normalizeFilters(filters as Record<string, unknown>), tenantId] as const,
    infinite: (filters?: TransactionFilters, tenantId?: string) =>
      [ViewNames.TransactionsView, normalizeFilters(filters as Record<string, unknown>), tenantId, "infinite"] as const,
    transfer: (id?: string, tenantId?: string) => [TableNames.Transactions, "transfer", id, tenantId] as const,
    deletedInfinite: (tenantId?: string, pageSize?: number) =>
      [TableNames.Transactions, "deleted", tenantId, "infinite", pageSize] as const,
    splitChildren: (splitFromId?: string, tenantId?: string) =>
      [TableNames.Transactions, "split-children", splitFromId, tenantId] as const,
  },

  transactionItems: {
    ...entityKeys(TableNames.TransactionItems),
    /** Same shape as `.detail` — the item list for a given transaction id. */
    byTransaction: (transactionId?: string, tenantId?: string) =>
      [TableNames.TransactionItems, transactionId, tenantId] as const,
  },

  transactionCategories: {
    ...entityKeys(TableNames.TransactionCategories),
    withGroup: (tenantId?: string, isDeleted?: boolean) =>
      [TableNames.TransactionCategories, "WithGroup", tenantId, isDeleted] as const,
  },

  transactionGroups: {
    ...entityKeys(TableNames.TransactionGroups),
  },

  recurrings: {
    ...entityKeys(TableNames.Recurrings),
  },

  configurations: {
    ...entityKeys(TableNames.Configurations),
    byLookup: (table: string, type: string, key: string, tenantId?: string) =>
      [TableNames.Configurations, table, type, key, tenantId] as const,
  },

  savingsBuckets: {
    ...entityKeys(TableNames.SavingsBuckets),
    byAccount: (accountId?: string, tenantId?: string) =>
      [TableNames.SavingsBuckets, "byAccount", accountId, tenantId] as const,
    totalAllocated: (accountId?: string, tenantId?: string) =>
      [TableNames.SavingsBuckets, "totalAllocated", accountId, tenantId] as const,
    grouped: (tenantId?: string) => [TableNames.SavingsBuckets, "grouped", tenantId] as const,
  },

  stats: {
    /** Broad per-view prefixes, used by the "refresh all stats" invalidation. */
    dailyAll: [ViewNames.StatsDailyTransactions] as const,
    monthlyTypesAll: [ViewNames.StatsMonthlyTransactionsTypes] as const,
    monthlyCategoriesAll: [ViewNames.StatsMonthlyCategoriesTransactions] as const,
    monthlyAccountsAll: [ViewNames.StatsMonthlyAccountsTransactions] as const,
    netWorthAll: [ViewNames.StatsNetWorthGrowth] as const,
    daily: (startDate?: string, endDate?: string, type?: string, tenantId?: string) =>
      [ViewNames.StatsDailyTransactions, startDate, endDate, type, tenantId] as const,
    dailyRaw: (startDate?: string, endDate?: string, type?: string, tenantId?: string) =>
      [ViewNames.StatsDailyTransactions, "raw", startDate, endDate, type, tenantId] as const,
    monthlyTypes: (startDate?: string, endDate?: string, tenantId?: string) =>
      [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate, tenantId] as const,
    monthlyCategories: (startDate?: string, endDate?: string, tenantId?: string) =>
      [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, tenantId] as const,
    monthlyCategoriesRaw: (startDate?: string, endDate?: string, tenantId?: string) =>
      [ViewNames.StatsMonthlyCategoriesTransactions, "raw", startDate, endDate, tenantId] as const,
    monthlyAccounts: (startDate?: string, endDate?: string, tenantId?: string) =>
      [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate, tenantId] as const,
    netWorth: (startDate?: string, endDate?: string, tenantId?: string) =>
      [ViewNames.StatsNetWorthGrowth, startDate, endDate, tenantId] as const,
  },

  /** Non-table caches keyed by their own literal prefixes. */
  fx: {
    rates: (base?: string) => ["fx-rates", (base ?? "USD").toUpperCase()] as const,
  },

  primaryCurrency: (storageMode?: string | null, userId?: string) =>
    ["primaryCurrency", storageMode ?? "none", userId ?? "anon"] as const,
} as const;
