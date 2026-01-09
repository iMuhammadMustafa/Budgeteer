import { DatabaseContext } from "@/src/types/database/drizzle";
import { IAccountCategoryRepository } from "./interfaces/IAccountCategoryRepository";
import { IAccountRepository } from "./interfaces/IAccountRepository";
import { IConfigurationRepository } from "./interfaces/IConfigurationRepository";
import { IRecurringRepository } from "./interfaces/IRecurringRepository";
import { IStatsRepository } from "./interfaces/IStatsRepository";
import { ITransactionCategoryRepository } from "./interfaces/ITransactionCategoryRepository";
import { ITransactionGroupRepository } from "./interfaces/ITransactionGroupRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";

import {
  AccountCategoryDrizzleRepository,
  AccountDrizzleRepository,
  ConfigurationDrizzleRepository,
  RecurringDrizzleRepository,
  StatsDrizzleRepository,
  TransactionCategoryDrizzleRepository,
  TransactionDrizzleRepository,
  TransactionGroupDrizzleRepository,
} from "./drizzle";

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

export function createRepositoryFactory(dbContext: DatabaseContext): IRepositoryFactory {
  return {
    AccountCategoryRepository: () => new AccountCategoryDrizzleRepository(dbContext),
    AccountRepository: () => new AccountDrizzleRepository(dbContext),
    ConfigurationRepository: () => new ConfigurationDrizzleRepository(dbContext),
    RecurringRepository: () => new RecurringDrizzleRepository(dbContext),
    StatsRepository: () => new StatsDrizzleRepository(dbContext),
    TransactionCategoryRepository: () => new TransactionCategoryDrizzleRepository(dbContext),
    TransactionGroupRepository: () => new TransactionGroupDrizzleRepository(dbContext),
    TransactionRepository: () => new TransactionDrizzleRepository(dbContext),
  };
}
