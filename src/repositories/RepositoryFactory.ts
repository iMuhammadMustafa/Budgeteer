import { StorageMode } from "@/src/types/StorageMode";
import { IAccountCategoryRepository } from "./interfaces/IAccountCategoryRepository";
import { IAccountRepository } from "./interfaces/IAccountRepository";
import { IConfigurationRepository } from "./interfaces/IConfigurationRepository";
import { IRecurringRepository } from "./interfaces/IRecurringRepository";
import { IStatsRepository } from "./interfaces/IStatsRepository";
import { ITransactionCategoryRepository } from "./interfaces/ITransactionCategoryRepository";
import { ITransactionGroupRepository } from "./interfaces/ITransactionGroupRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";

// Supabase repositories
import { AccountCategorySupaRepository } from "./supabase/AccountCategories.supa";
import { AccountSupaRepository } from "./supabase/Accounts.supa";
import { ConfigurationSupaRepository } from "./supabase/Configurations.supa";
import { RecurringSupaRepository } from "./supabase/Recurrings.api.supa";
import { StatsSupaRepository } from "./supabase/Stats.supa";
import { TransactionCategorySupaRepository } from "./supabase/TransactionCategories.supa";
import { TransactionGroupSupaRepository } from "./supabase/TransactionGroups.supa";
import { TransactionSupaRepository } from "./supabase/Transactions.supa";

// SQLite repositories
import { AccountCategorySqliteRepository } from "./sqlite/AccountCategories.sqlite";
import { AccountSqliteRepository } from "./sqlite/Accounts.sqlite";
import { ConfigurationSqliteRepository } from "./sqlite/Configurations.sqlite";
import { RecurringSqliteRepository } from "./sqlite/Recurrings.sqlite";
import { StatsSqliteRepository } from "./sqlite/Stats.sqlite";
import { TransactionCategorySqliteRepository } from "./sqlite/TransactionCategories.sqlite";
import { TransactionGroupSqliteRepository } from "./sqlite/TransactionGroups.sqlite";
import { TransactionSqliteRepository } from "./sqlite/Transactions.sqlite";

export interface IRepositoryFactory {
  AccountCategoryRepository(): IAccountCategoryRepository;
  AccountRepository(): IAccountRepository;
  ConfigurationRepository(): IConfigurationRepository;
  RecurringRepository(): IRecurringRepository;
  StatsRepository(): IStatsRepository;
  TransactionCategoryRepository(): ITransactionCategoryRepository;
  TransactionGroupRepository(): ITransactionGroupRepository;
  TransactionRepository(): ITransactionRepository;
}

export function createRepositoryFactory(storageMode: StorageMode | null): IRepositoryFactory {
  if (storageMode === StorageMode.Cloud) {
    return {
      AccountCategoryRepository: () => new AccountCategorySupaRepository(),
      AccountRepository: () => new AccountSupaRepository(),
      ConfigurationRepository: () => new ConfigurationSupaRepository(),
      RecurringRepository: () => new RecurringSupaRepository(),
      StatsRepository: () => new StatsSupaRepository(),
      TransactionCategoryRepository: () => new TransactionCategorySupaRepository(),
      TransactionGroupRepository: () => new TransactionGroupSupaRepository(),
      TransactionRepository: () => new TransactionSupaRepository(),
    };
  }
  return {
    AccountCategoryRepository: () => new AccountCategorySqliteRepository(),
    AccountRepository: () => new AccountSqliteRepository(),
    ConfigurationRepository: () => new ConfigurationSqliteRepository(),
    RecurringRepository: () => new RecurringSqliteRepository(),
    StatsRepository: () => new StatsSqliteRepository(),
    TransactionCategoryRepository: () => new TransactionCategorySqliteRepository(),
    TransactionGroupRepository: () => new TransactionGroupSqliteRepository(),
    TransactionRepository: () => new TransactionSqliteRepository(),
  };
}
