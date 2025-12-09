import { Database } from "./supabase/supabase.types";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

// Tables
export type Account = Tables<"accounts"> & { runningbalance?: number | null; category?: AccountCategory };
export type AccountCategory = Tables<"accountcategories">;

export type Transaction = Tables<"transactions">;
export type TransactionCategory = Tables<"transactioncategories"> & { group?: TransactionGroup };
export type TransactionGroup = Tables<"transactiongroups">;

export type Configuration = Tables<"configurations">;
export type Recurring = Tables<"recurrings"> & { type: TransactionType };

// Materialized Views
export type TransactionsView = Views<"transactionsview">;

// Views
export type ViewAccountsWithRunningBalance = Views<"view_accounts_with_runningbalance">;
export type SearchDistinctTransactions = Views<"search_distincttransactions">;
export type StatsDailyTransactions = Views<"stats_dailytransactions">;
export type StatsMonthlyTransactionsTypes = Views<"stats_monthlytransactionstypes">;
export type StatsMonthlyCategoriesTransactions = Views<"stats_monthlycategoriestransactions">;
export type StatsMonthlyAccountsTransactions = Views<"stats_monthlyaccountstransactions">;
export type StatsNetWorthGrowth = Views<"stats_networthgrowth">;
export type StatsTotalAccountBalance = Views<"stats_totalaccountbalance">;

// Enums
export type AccountType = Enums<"accounttypes">;
export type TransactionStatus = Enums<"transactionstatuses">;
export type TransactionType = Enums<"transactiontypes">;
