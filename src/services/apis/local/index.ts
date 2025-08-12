// Export all local storage providers
export * as AccountsLocal from './Accounts.local';
export * as AccountCategoriesLocal from './AccountCategories.local';
export * as TransactionsLocal from './Transactions.local';
export * as TransactionCategoriesLocal from './TransactionCategories.local';
export * as TransactionGroupsLocal from './TransactionGroups.local';
export * as ConfigurationsLocal from './Configurations.local';
export * as RecurringsLocal from './Recurrings.local';
export * as StatsLocal from './Stats.local';

// Export database instance and provider
export { db, BudgeteerDatabase } from './BudgeteerDatabase';
export { LocalStorageProvider, localStorageProvider } from './LocalStorageProvider';
export { MigrationManager, initializeMigrations } from './migrations';