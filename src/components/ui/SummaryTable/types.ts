/** Shared contracts for the SummaryTable (Step 3 §10, rebuilt from scratch). */

export type TimePeriod = "monthly" | "quarterly" | "yearly";

export interface PeriodMeta {
  label: string;
  start: string;
  end: string;
  isCurrent?: boolean;
}

/** One category, with per-period values indexed parallel to `periods`. */
export interface SummaryRow {
  group: string;
  category: string;
  groupIcon?: string | null;
  categoryIcon?: string | null;
  groupBudget?: number | null;
  /** length === periods.length */
  amounts: number[];
  /** length === periods.length */
  budgets: number[];
}

export interface SummaryGridProps {
  periods: PeriodMeta[];
  rows: SummaryRow[];
  /** per-period grand totals; length === periods.length */
  totals: number[];
  formatCurrency: (n: number, signed?: boolean) => string;
  refreshing?: boolean;
  onRefresh?: () => void;
  legendWidth?: number;
  columnMinWidth?: number;
}
