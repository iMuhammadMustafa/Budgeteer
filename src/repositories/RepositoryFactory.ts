import { StorageMode } from "../types/StorageMode";
import { IAccountCategoryRepository } from "./interfaces/IAccountCategoryRepository";
import { IAccountRepository } from "./interfaces/IAccountRepository";
import { IConfigurationRepository } from "./interfaces/IConfigurationRepository";
import { IRecurringRepository } from "./interfaces/IRecurringRepository";
import { IStatsRepository } from "./interfaces/IStatsRepository";
import { ITransactionCategoryRepository } from "./interfaces/ITransactionCategoryRepository";
import { ITransactionGroupRepository } from "./interfaces/ITransactionGroupRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";
import { AccountCategorySupaRepository } from "./supabase/AccountCategories.supa";
import { AccountSupaRepository } from "./supabase/Accounts.supa";
import { ConfigurationSupaRepository } from "./supabase/Configurations.supa";
import { RecurringSupaRepository } from "./supabase/Recurrings.api.supa";
import { StatsSupaRepository } from "./supabase/Stats.supa";
import { TransactionCategorySupaRepository } from "./supabase/TransactionCategories.supa";
import { TransactionGroupSupaRepository } from "./supabase/TransactionGroups.supa";
import { TransactionSupaRepository } from "./supabase/Transactions.supa";
import { AccountCategorySQLiteRepository } from "./sqlite/AccountCategories.sqlite";
import { AccountSQLiteRepository } from "./sqlite/Accounts.sqlite";
import { ConfigurationSQLiteRepository } from "./sqlite/Configurations.sqlite";
import { RecurringSQLiteRepository } from "./sqlite/Recurrings.sqlite";
import { StatsSQLiteRepository } from "./sqlite/Stats.sqlite";
import { TransactionCategorySQLiteRepository } from "./sqlite/TransactionCategories.sqlite";
import { TransactionGroupSQLiteRepository } from "./sqlite/TransactionGroups.sqlite";
import { TransactionSQLiteRepository } from "./sqlite/Transactions.sqlite";

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

export function createRepositoryFactory(storageMode: StorageMode): IRepositoryFactory {
  if (storageMode === StorageMode.Local) {
    return {
      AccountCategoryRepository: () => new AccountCategorySQLiteRepository(),
      AccountRepository: () => new AccountSQLiteRepository(),
      ConfigurationRepository: () => new ConfigurationSQLiteRepository(),
      RecurringRepository: () => new RecurringSQLiteRepository(),
      StatsRepository: () => new StatsSQLiteRepository(),
      TransactionCategoryRepository: () => new TransactionCategorySQLiteRepository(),
      TransactionGroupRepository: () => new TransactionGroupSQLiteRepository(),
      TransactionRepository: () => new TransactionSQLiteRepository(),
    };
  }

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
