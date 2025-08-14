/**
 * Local Data Provider for Referential Integrity Validation
 * 
 * This provider implements the IDataProvider interface for the local storage mode,
 * allowing the referential integrity validator to work with local SQLite/IndexedDB data.
 */

import { IDataProvider } from './ReferentialIntegrityValidator';
import { BudgeteerSQLiteDatabase } from '../local/BudgeteerSQLiteDatabase';
import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type AccountRow = Tables['accounts']['Row'];
type AccountCategoryRow = Tables['accountcategories']['Row'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionCategoryRow = Tables['transactioncategories']['Row'];
type TransactionGroupRow = Tables['transactiongroups']['Row'];
type RecurringRow = Tables['recurrings']['Row'];
type ConfigurationRow = Tables['configurations']['Row'];

export class LocalDataProvider implements IDataProvider {
  private db: BudgeteerSQLiteDatabase;

  constructor() {
    this.db = BudgeteerSQLiteDatabase.getInstance();
  }

  // Core data access methods
  async getAccountCategories(tenantId: string): Promise<AccountCategoryRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM accountcategories WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as AccountCategoryRow[];
  }

  async getAccounts(tenantId: string): Promise<AccountRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM accounts WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as AccountRow[];
  }

  async getTransactions(tenantId: string): Promise<TransactionRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM transactions WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as TransactionRow[];
  }

  async getTransactionCategories(tenantId: string): Promise<TransactionCategoryRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM transactioncategories WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as TransactionCategoryRow[];
  }

  async getTransactionGroups(tenantId: string): Promise<TransactionGroupRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM transactiongroups WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as TransactionGroupRow[];
  }

  async getRecurrings(tenantId: string): Promise<RecurringRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM recurrings WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as RecurringRow[];
  }

  async getConfigurations(tenantId: string): Promise<ConfigurationRow[]> {
    await this.db.initialize();
    const result = await this.db.database.getAllAsync(
      'SELECT * FROM configurations WHERE tenantid = ? AND isdeleted = 0',
      [tenantId]
    );
    return result as ConfigurationRow[];
  }

  // Single record access methods
  async getAccountCategoryById(id: string): Promise<AccountCategoryRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM accountcategories WHERE id = ?',
      [id]
    );
    return result as AccountCategoryRow | null;
  }

  async getAccountById(id: string): Promise<AccountRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM accounts WHERE id = ?',
      [id]
    );
    return result as AccountRow | null;
  }

  async getTransactionById(id: string): Promise<TransactionRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return result as TransactionRow | null;
  }

  async getTransactionCategoryById(id: string): Promise<TransactionCategoryRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM transactioncategories WHERE id = ?',
      [id]
    );
    return result as TransactionCategoryRow | null;
  }

  async getTransactionGroupById(id: string): Promise<TransactionGroupRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM transactiongroups WHERE id = ?',
      [id]
    );
    return result as TransactionGroupRow | null;
  }

  async getRecurringById(id: string): Promise<RecurringRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM recurrings WHERE id = ?',
      [id]
    );
    return result as RecurringRow | null;
  }

  async getConfigurationById(id: string): Promise<ConfigurationRow | null> {
    await this.db.initialize();
    const result = await this.db.database.getFirstAsync(
      'SELECT * FROM configurations WHERE id = ?',
      [id]
    );
    return result as ConfigurationRow | null;
  }
}