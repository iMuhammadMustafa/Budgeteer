/**
 * Repository Factory - WatermelonDB Migration Complete
 * All repositories have been implemented for both Cloud (Supabase) and Local (WatermelonDB) storage modes.
 * WatermelonDB repositories provide offline-first functionality with sync capabilities.
 */
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
import { AccountCategoryWatermelonRepository } from "./watermelondb/AccountCategories.watermelon";
import { AccountWatermelonRepository } from "./watermelondb/Accounts.watermelon";
import { ConfigurationWatermelonRepository } from "./watermelondb/Configurations.watermelon";
import { RecurringWatermelonRepository } from "./watermelondb/Recurrings.watermelon";
import { StatsWatermelonRepository } from "./watermelondb/Stats.watermelon";
import { TransactionCategoryWatermelonRepository } from "./watermelondb/TransactionCategories.watermelon";
import { TransactionGroupWatermelonRepository } from "./watermelondb/TransactionGroups.watermelon";
import { TransactionWatermelonRepository } from "./watermelondb/Transactions.watermelon";

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
    AccountCategoryRepository: () => new AccountCategoryWatermelonRepository(),
    AccountRepository: () => new AccountWatermelonRepository(),
    TransactionGroupRepository: () => new TransactionGroupWatermelonRepository(),
    TransactionCategoryRepository: () => new TransactionCategoryWatermelonRepository(),
    ConfigurationRepository: () => new ConfigurationWatermelonRepository(),
    RecurringRepository: () => new RecurringWatermelonRepository(),
    StatsRepository: () => new StatsWatermelonRepository(),
    TransactionRepository: () => new TransactionWatermelonRepository(),
  };
}
