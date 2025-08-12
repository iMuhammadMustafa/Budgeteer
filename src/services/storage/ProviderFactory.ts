// Provider factory for creating storage implementations based on mode

import { StorageMode, EntityType, ProviderRegistry } from './types';

// Import existing implementations
import * as AccountsSupabase from '../apis/supabase/Accounts.supa';
import * as AccountsMock from '../apis/__mock__/Accounts.mock';

import * as AccountCategoriesSupabase from '../apis/supabase/AccountCategories.supa';
import * as AccountCategoriesMock from '../apis/__mock__/AccountCategories.mock';

import * as TransactionsSupabase from '../apis/supabase/Transactions.supa';
import * as TransactionsMock from '../apis/__mock__/Transactions.mock';

import * as TransactionCategoriesSupabase from '../apis/supabase/TransactionCategories.supa';
import * as TransactionCategoriesMock from '../apis/__mock__/TransactionCategories.mock';

import * as TransactionGroupsSupabase from '../apis/supabase/TransactionGroups.supa';
import * as TransactionGroupsMock from '../apis/__mock__/TransactionGroups.mock';

import * as ConfigurationsSupabase from '../apis/supabase/Configurations.supa';
import * as ConfigurationsMock from '../apis/__mock__/Configurations.mock';

import * as RecurringsSupabase from '../apis/supabase/Recurrings.api.supa';
import * as RecurringsMock from '../apis/__mock__/Recurrings.mock';

import * as StatsSupabase from '../apis/supabase/Stats.supa';
import * as StatsMock from '../apis/__mock__/Stats.mock';

export class ProviderFactory {
  private static instance: ProviderFactory;
  
  private constructor() {}
  
  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }
  
  public createProvider<T extends EntityType>(
    entityType: T, 
    mode: StorageMode
  ): ProviderRegistry[T] {
    switch (entityType) {
      case 'accounts':
        return this.createAccountProvider(mode) as ProviderRegistry[T];
      case 'accountCategories':
        return this.createAccountCategoryProvider(mode) as ProviderRegistry[T];
      case 'transactions':
        return this.createTransactionProvider(mode) as ProviderRegistry[T];
      case 'transactionCategories':
        return this.createTransactionCategoryProvider(mode) as ProviderRegistry[T];
      case 'transactionGroups':
        return this.createTransactionGroupProvider(mode) as ProviderRegistry[T];
      case 'configurations':
        return this.createConfigurationProvider(mode) as ProviderRegistry[T];
      case 'recurrings':
        return this.createRecurringProvider(mode) as ProviderRegistry[T];
      case 'stats':
        return this.createStatsProvider(mode) as ProviderRegistry[T];
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
  
  private createAccountProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return AccountsSupabase;
      case 'demo':
        return AccountsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createAccountCategoryProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return AccountCategoriesSupabase;
      case 'demo':
        return AccountCategoriesMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createTransactionProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return TransactionsSupabase;
      case 'demo':
        return TransactionsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createTransactionCategoryProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return TransactionCategoriesSupabase;
      case 'demo':
        return TransactionCategoriesMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createTransactionGroupProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return TransactionGroupsSupabase;
      case 'demo':
        return TransactionGroupsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createConfigurationProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return ConfigurationsSupabase;
      case 'demo':
        return ConfigurationsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createRecurringProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return RecurringsSupabase;
      case 'demo':
        return RecurringsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
  
  private createStatsProvider(mode: StorageMode) {
    switch (mode) {
      case 'cloud':
        return StatsSupabase;
      case 'demo':
        return StatsMock;
      case 'local':
        // TODO: Will be implemented in task 3 and 4
        throw new Error('Local storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
}