// Provider factory for creating storage implementations based on mode

import { StorageMode, EntityType, ProviderRegistry } from "./types";

// Import provider classes and instances
import * as AccountsSupabase from "../apis/supabase/Accounts.supa";
import * as AccountsMock from "../apis/__mock__/Accounts.mock";

import * as AccountCategoriesSupabase from "../apis/supabase/AccountCategories.supa";
import * as AccountCategoriesMock from "../apis/__mock__/AccountCategories.mock";

import * as TransactionsSupabase from "../apis/supabase/Transactions.supa";
import * as TransactionsMock from "../apis/__mock__/Transactions.mock";

import * as TransactionCategoriesSupabase from "../apis/supabase/TransactionCategories.supa";
import * as TransactionCategoriesMock from "../apis/__mock__/TransactionCategories.mock";

import * as TransactionGroupsSupabase from "../apis/supabase/TransactionGroups.supa";
import * as TransactionGroupsMock from "../apis/__mock__/TransactionGroups.mock";

import * as ConfigurationsSupabase from "../apis/supabase/Configurations.supa";
import * as ConfigurationsMock from "../apis/__mock__/Configurations.mock";

import * as RecurringsSupabase from "../apis/supabase/Recurrings.api.supa";
import * as RecurringsMock from "../apis/__mock__/Recurrings.mock";

import * as StatsSupabase from "../apis/supabase/Stats.supa";
import { mockStatsProvider } from "../apis/__mock__/Stats.mock";

// Import local implementations (IndexedDB)
import * as AccountsLocal from "../apis/local/Accounts.local";
import * as AccountCategoriesLocal from "../apis/local/AccountCategories.local";
import * as TransactionsLocal from "../apis/local/Transactions.local";
import * as TransactionCategoriesLocal from "../apis/local/TransactionCategories.local";
import * as TransactionGroupsLocal from "../apis/local/TransactionGroups.local";
import * as ConfigurationsLocal from "../apis/local/Configurations.local";
import * as RecurringsLocal from "../apis/local/Recurrings.local";
import * as StatsLocal from "../apis/local/Stats.local";

// Import SQLite providers (with platform detection and lazy loading)
import * as SQLiteProviders from "../apis/local/sqlite";

// Import platform detection for SQLite vs IndexedDB
import { Platform } from "react-native";

export class ProviderFactory {
  private static instance: ProviderFactory;

  private constructor() {}

  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  /**
   * Determines if SQLite providers are available and should be used for local storage
   * @returns true if SQLite is available, false if should fallback to IndexedDB
   */
  private isSQLiteAvailable(): boolean {
    // Check if running on native platform (not web)
    if (Platform.OS === "web") {
      return false;
    }

    // Check if SQLite providers were successfully loaded
    return SQLiteProviders.sqliteAccountProvider !== null;
  }

  /**
   * Gets the appropriate local provider based on platform capabilities
   * @param fallbackProvider - IndexedDB provider to use if SQLite is not available
   * @param sqliteProvider - SQLite provider to use if available
   * @returns The appropriate provider or throws error if none available
   */
  private getLocalProvider<T>(fallbackProvider: T, sqliteProvider: T | null, entityType: EntityType): T {
    if (this.isSQLiteAvailable() && sqliteProvider !== null) {
      console.log(`Using SQLite provider for ${entityType}`);
      return sqliteProvider;
    }

    if (fallbackProvider) {
      console.log(`Using IndexedDB provider for ${entityType}`);
      return fallbackProvider;
    }

    throw new Error(
      `No local storage provider available for ${entityType}. SQLite not available and IndexedDB provider missing.`,
    );
  }

  public createProvider<T extends EntityType>(entityType: T, mode: StorageMode): ProviderRegistry[T] {
    try {
      switch (entityType) {
        case "accounts":
          return this.createAccountProvider(mode) as unknown as ProviderRegistry[T];
        case "accountCategories":
          return this.createAccountCategoryProvider(mode) as unknown as ProviderRegistry[T];
        case "transactions":
          return this.createTransactionProvider(mode) as unknown as ProviderRegistry[T];
        case "transactionCategories":
          return this.createTransactionCategoryProvider(mode) as unknown as ProviderRegistry[T];
        case "transactionGroups":
          return this.createTransactionGroupProvider(mode) as unknown as ProviderRegistry[T];
        case "configurations":
          return this.createConfigurationProvider(mode) as unknown as ProviderRegistry[T];
        case "recurrings":
          return this.createRecurringProvider(mode) as unknown as ProviderRegistry[T];
        case "stats":
          return this.createStatsProvider(mode) as unknown as ProviderRegistry[T];
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      console.error(`Failed to create provider for ${entityType} in ${mode} mode:`, error);
      throw new Error(
        `Provider creation failed for ${entityType}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private createAccountProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!AccountsSupabase.supabaseAccountProvider) {
          throw new Error("Supabase account provider not available");
        }
        return AccountsSupabase.supabaseAccountProvider;
      case "demo":
        return new AccountsMock.MockAccountProvider();
      case "local":
        return this.getLocalProvider(
          AccountsLocal.localAccountProvider,
          SQLiteProviders.sqliteAccountProvider,
          "accounts",
        );
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createAccountCategoryProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!AccountCategoriesSupabase.supabaseAccountCategoryProvider) {
          throw new Error("Supabase account category provider not available");
        }
        return AccountCategoriesSupabase.supabaseAccountCategoryProvider;
      case "demo":
        return AccountCategoriesMock.mockAccountCategoryProvider;
      case "local":
        return this.getLocalProvider(
          AccountCategoriesLocal,
          SQLiteProviders.sqliteAccountCategoryProvider,
          "accountCategories",
        );
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createTransactionProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!TransactionsSupabase.supabaseTransactionProvider) {
          throw new Error("Supabase transaction provider not available");
        }
        return TransactionsSupabase.supabaseTransactionProvider;
      case "demo":
        return TransactionsMock.mockTransactionProvider;
      case "local":
        return this.getLocalProvider(TransactionsLocal, SQLiteProviders.sqliteTransactionProvider, "transactions");
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createTransactionCategoryProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!TransactionCategoriesSupabase.supabaseTransactionCategoryProvider) {
          throw new Error("Supabase transaction category provider not available");
        }
        return TransactionCategoriesSupabase.supabaseTransactionCategoryProvider;
      case "demo":
        return TransactionCategoriesMock.mockTransactionCategoryProvider;
      case "local":
        return this.getLocalProvider(
          TransactionCategoriesLocal,
          SQLiteProviders.sqliteTransactionCategoryProvider,
          "transactionCategories",
        );
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createTransactionGroupProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!TransactionGroupsSupabase.supabaseTransactionGroupProvider) {
          throw new Error("Supabase transaction group provider not available");
        }
        return TransactionGroupsSupabase.supabaseTransactionGroupProvider;
      case "demo":
        return TransactionGroupsMock.mockTransactionGroupProvider;
      case "local":
        return this.getLocalProvider(
          TransactionGroupsLocal,
          SQLiteProviders.sqliteTransactionGroupProvider,
          "transactionGroups",
        );
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createConfigurationProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!ConfigurationsSupabase.supabaseConfigurationProvider) {
          throw new Error("Supabase configuration provider not available");
        }
        return ConfigurationsSupabase.supabaseConfigurationProvider;
      case "demo":
        return ConfigurationsMock.mockConfigurationProvider;
      case "local":
        return this.getLocalProvider(
          ConfigurationsLocal,
          SQLiteProviders.sqliteConfigurationProvider,
          "configurations",
        );
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createRecurringProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!RecurringsSupabase.supabaseRecurringProvider) {
          throw new Error("Supabase recurring provider not available");
        }
        return RecurringsSupabase.supabaseRecurringProvider;
      case "demo":
        return RecurringsMock.mockRecurringProvider;
      case "local":
        return this.getLocalProvider(RecurringsLocal, SQLiteProviders.sqliteRecurringProvider, "recurrings");
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  private createStatsProvider(mode: StorageMode) {
    switch (mode) {
      case "cloud":
        if (!StatsSupabase.supabaseStatsProvider) {
          throw new Error("Supabase stats provider not available");
        }
        return StatsSupabase.supabaseStatsProvider;
      case "demo":
        return mockStatsProvider;
      case "local":
        return this.getLocalProvider(StatsLocal, SQLiteProviders.sqliteStatsProvider, "stats");
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }
}
