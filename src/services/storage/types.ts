// Core types and interfaces for the multi-tier storage architecture

export type StorageMode = 'cloud' | 'demo' | 'local';

export interface IStorageProvider {
  mode: StorageMode;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ReferentialIntegrityError extends StorageError {
  constructor(table: string, field: string, value: string) {
    super(
      `Referenced record not found: ${table}.${field} = ${value}`,
      'REFERENTIAL_INTEGRITY_ERROR',
      { table, field, value }
    );
  }
}

// Provider interfaces for each entity type
export interface IAccountProvider {
  getAllAccounts(tenantId: string): Promise<any[]>;
  getAccountById(id: string, tenantId: string): Promise<any | null>;
  createAccount(account: any): Promise<any>;
  updateAccount(account: any): Promise<any>;
  deleteAccount(id: string, userId?: string): Promise<any>;
  restoreAccount(id: string, userId?: string): Promise<any>;
  updateAccountBalance(accountid: string, amount: number): Promise<any>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}

export interface IAccountCategoryProvider {
  getAllAccountCategories(tenantId: string): Promise<any[]>;
  getAccountCategoryById(id: string, tenantId: string): Promise<any | null>;
  createAccountCategory(category: any): Promise<any>;
  updateAccountCategory(category: any): Promise<any>;
  deleteAccountCategory(id: string, userId?: string): Promise<any>;
  restoreAccountCategory(id: string, userId?: string): Promise<any>;
}

export interface ITransactionProvider {
  getAllTransactions(tenantId: string): Promise<any[]>;
  getTransactionById(id: string, tenantId: string): Promise<any | null>;
  createTransaction(transaction: any): Promise<any>;
  updateTransaction(transaction: any): Promise<any>;
  deleteTransaction(id: string, userId?: string): Promise<any>;
  restoreTransaction(id: string, userId?: string): Promise<any>;
  getTransactionsByAccount(accountId: string, tenantId: string): Promise<any[]>;
  getTransactionsByCategory(categoryId: string, tenantId: string): Promise<any[]>;
  getTransactionsByDateRange(startDate: string, endDate: string, tenantId: string): Promise<any[]>;
}

export interface ITransactionCategoryProvider {
  getAllTransactionCategories(tenantId: string): Promise<any[]>;
  getTransactionCategoryById(id: string, tenantId: string): Promise<any | null>;
  createTransactionCategory(category: any): Promise<any>;
  updateTransactionCategory(category: any): Promise<any>;
  deleteTransactionCategory(id: string, userId?: string): Promise<any>;
  restoreTransactionCategory(id: string, userId?: string): Promise<any>;
}

export interface ITransactionGroupProvider {
  getAllTransactionGroups(tenantId: string): Promise<any[]>;
  getTransactionGroupById(id: string, tenantId: string): Promise<any | null>;
  createTransactionGroup(group: any): Promise<any>;
  updateTransactionGroup(group: any): Promise<any>;
  deleteTransactionGroup(id: string, userId?: string): Promise<any>;
  restoreTransactionGroup(id: string, userId?: string): Promise<any>;
}

export interface IConfigurationProvider {
  getAllConfigurations(tenantId: string): Promise<any[]>;
  getConfigurationById(id: string, tenantId: string): Promise<any | null>;
  createConfiguration(config: any): Promise<any>;
  updateConfiguration(config: any): Promise<any>;
  deleteConfiguration(id: string, userId?: string): Promise<any>;
  restoreConfiguration(id: string, userId?: string): Promise<any>;
}

export interface IRecurringProvider {
  getAllRecurrings(tenantId: string): Promise<any[]>;
  getRecurringById(id: string, tenantId: string): Promise<any | null>;
  createRecurring(recurring: any): Promise<any>;
  updateRecurring(recurring: any): Promise<any>;
  deleteRecurring(id: string, userId?: string): Promise<any>;
  restoreRecurring(id: string, userId?: string): Promise<any>;
}

export interface IStatsProvider {
  getStats(tenantId: string): Promise<any>;
  getAccountStats(accountId: string, tenantId: string): Promise<any>;
  getCategoryStats(categoryId: string, tenantId: string): Promise<any>;
}

// Provider registry type
export type ProviderRegistry = {
  accounts: IAccountProvider;
  accountCategories: IAccountCategoryProvider;
  transactions: ITransactionProvider;
  transactionCategories: ITransactionCategoryProvider;
  transactionGroups: ITransactionGroupProvider;
  configurations: IConfigurationProvider;
  recurrings: IRecurringProvider;
  stats: IStatsProvider;
};

export type EntityType = keyof ProviderRegistry;