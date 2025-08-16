// Repository classes implementing the repository interfaces
export { AccountCategorySupaRepository } from "./supabase/AccountCategories.supa";
export { AccountSupaRepository } from "./supabase/Accounts.supa";
export { ConfigurationSupaRepository } from "./supabase/Configurations.supa";
export { RecurringSupaRepository } from "./supabase/Recurrings.api.supa";
export { StatsSupaRepository } from "./supabase/Stats.supa";
export { TransactionCategorySupaRepository } from "./supabase/TransactionCategories.supa";
export { TransactionGroupSupaRepository } from "./supabase/TransactionGroups.supa";
export { TransactionSupaRepository } from "./supabase/Transactions.supa";

// Repository interfaces
export * from "./interfaces/IRepository";
export * from "./interfaces/IAccountCategoryRepository";
export * from "./interfaces/IAccountRepository";
export * from "./interfaces/IConfigurationRepository";
export * from "./interfaces/IRecurringRepository";
export * from "./interfaces/IStatsRepository";
export * from "./interfaces/ITransactionCategoryRepository";
export * from "./interfaces/ITransactionGroupRepository";
export * from "./interfaces/ITransactionRepository";

// Legacy function exports for backward compatibility
export * from "./supabase/AccountCategories.supa";
export * from "./supabase/Accounts.supa";
export * from "./supabase/Configurations.supa";
export * from "./supabase/Recurrings.api.supa";
export * from "./supabase/Stats.supa";
export * from "./supabase/TransactionCategories.supa";
export * from "./supabase/TransactionGroups.supa";
export * from "./supabase/Transactions.supa";
