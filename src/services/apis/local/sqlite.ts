import { Platform } from 'react-native';

// SQLite providers (only available on native platforms)
export let sqliteAccountProvider: any = null;
export let sqliteAccountCategoryProvider: any = null;
export let sqliteTransactionProvider: any = null;
export let sqliteTransactionCategoryProvider: any = null;
export let sqliteTransactionGroupProvider: any = null;
export let sqliteConfigurationProvider: any = null;
export let sqliteRecurringProvider: any = null;
export let sqliteStatsProvider: any = null;
export let sqliteStorageProvider: any = null;
export let sqliteDb: any = null;
export let initializeSQLiteMigrations: any = null;

// Only import SQLite modules on native platforms
if (Platform.OS !== 'web') {
  try {
    // Dynamic imports to avoid loading SQLite on web
    const accountModule = require('./Accounts.sqlite');
    const accountCategoryModule = require('./AccountCategories.sqlite');
    const transactionModule = require('./Transactions.sqlite');
    const transactionCategoryModule = require('./TransactionCategories.sqlite');
    const transactionGroupModule = require('./TransactionGroups.sqlite');
    const configurationModule = require('./Configurations.sqlite');
    const recurringModule = require('./Recurrings.sqlite');
    const statsModule = require('./Stats.sqlite');
    const storageProviderModule = require('./SQLiteStorageProvider');
    const databaseModule = require('./BudgeteerSQLiteDatabase');
    const migrationsModule = require('./sqliteMigrations');

    sqliteAccountProvider = accountModule.sqliteAccountProvider;
    sqliteAccountCategoryProvider = accountCategoryModule.sqliteAccountCategoryProvider;
    sqliteTransactionProvider = transactionModule.sqliteTransactionProvider;
    sqliteTransactionCategoryProvider = transactionCategoryModule.sqliteTransactionCategoryProvider;
    sqliteTransactionGroupProvider = transactionGroupModule.sqliteTransactionGroupProvider;
    sqliteConfigurationProvider = configurationModule.sqliteConfigurationProvider;
    sqliteRecurringProvider = recurringModule.sqliteRecurringProvider;
    sqliteStatsProvider = statsModule.sqliteStatsProvider;
    sqliteStorageProvider = storageProviderModule.sqliteStorageProvider;
    sqliteDb = databaseModule.sqliteDb;
    initializeSQLiteMigrations = migrationsModule.initializeSQLiteMigrations;

    console.log('SQLite providers loaded successfully for native platform');
  } catch (error) {
    console.error('Failed to load SQLite providers:', error);
    // Fallback to null providers
  }
} else {
  console.log('SQLite providers not loaded on web platform - using IndexedDB instead');
}

// Helper function to check if SQLite is available
export function isSQLiteAvailable(): boolean {
  return Platform.OS !== 'web' && sqliteDb !== null;
}

// Helper function to get the appropriate storage provider based on platform
export function getNativeStorageProvider() {
  if (Platform.OS === 'web') {
    // Return IndexedDB provider for web
    const { localStorageProvider } = require('./LocalStorageProvider');
    return localStorageProvider;
  } else {
    // Return SQLite provider for native
    return sqliteStorageProvider;
  }
}

// Helper function to get the appropriate providers based on platform
export function getNativeProviders() {
  if (Platform.OS === 'web') {
    // Return IndexedDB providers for web
    const accountProvider = require('./Accounts.local').localAccountProvider;
    const accountCategoryProvider = require('./AccountCategories.local').localAccountCategoryProvider;
    const transactionProvider = require('./Transactions.local').localTransactionProvider;
    const transactionCategoryProvider = require('./TransactionCategories.local').localTransactionCategoryProvider;
    const transactionGroupProvider = require('./TransactionGroups.local').localTransactionGroupProvider;
    const configurationProvider = require('./Configurations.local').localConfigurationProvider;
    const recurringProvider = require('./Recurrings.local').localRecurringProvider;
    const statsProvider = require('./Stats.local').localStatsProvider;

    return {
      accounts: accountProvider,
      accountCategories: accountCategoryProvider,
      transactions: transactionProvider,
      transactionCategories: transactionCategoryProvider,
      transactionGroups: transactionGroupProvider,
      configurations: configurationProvider,
      recurrings: recurringProvider,
      stats: statsProvider
    };
  } else {
    // Return SQLite providers for native
    return {
      accounts: sqliteAccountProvider,
      accountCategories: sqliteAccountCategoryProvider,
      transactions: sqliteTransactionProvider,
      transactionCategories: sqliteTransactionCategoryProvider,
      transactionGroups: sqliteTransactionGroupProvider,
      configurations: sqliteConfigurationProvider,
      recurrings: sqliteRecurringProvider,
      stats: sqliteStatsProvider
    };
  }
}