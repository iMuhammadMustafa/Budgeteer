import { Database } from "./database.types";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

// Tables
export type Account = Tables<"accounts">;
export type AccountCategory = Tables<"accountcategories">;

export type Transaction = Tables<"transactions">;
export type TransactionCategory = Tables<"transactioncategories">;
export type TransactionGroup = Tables<"transactiongroups">;

// Materialized Views
export type TransactionsView = Views<"transactionsview">;

// Views
export type SearchDistinctTransactions = Views<"search_distincttransactions">;
export type StatsDailyTransactions = Views<"stats_dailytransactions">;
export type StatsMonthlyAccountsTransactions = Views<"stats_monthlyaccountstransactions">;

// Enums
export type AccountType = Enums<"accounttypes">;
export type TransactionStatus = Enums<"transactionstatuses">;
export type TransactionType = Enums<"transactiontypes">;
