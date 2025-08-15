import Dexie, { Table } from 'dexie';
import { Database } from '../../../types/db/database.types';
import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError, 
  ValidationError 
} from '../../storage/errors/StorageErrors';

// Type definitions for our local database tables
export type LocalAccount = Database['public']['Tables']['accounts']['Row'];
export type LocalAccountCategory = Database['public']['Tables']['accountcategories']['Row'];
export type LocalTransaction = Database['public']['Tables']['transactions']['Row'];
export type LocalTransactionCategory = Database['public']['Tables']['transactioncategories']['Row'];
export type LocalTransactionGroup = Database['public']['Tables']['transactiongroups']['Row'];
export type LocalConfiguration = Database['public']['Tables']['configurations']['Row'];
export type LocalRecurring = Database['public']['Tables']['recurrings']['Row'];

export class BudgeteerDatabase extends Dexie {
  // Table declarations
  accounts!: Table<LocalAccount>;
  accountcategories!: Table<LocalAccountCategory>;
  transactions!: Table<LocalTransaction>;
  transactioncategories!: Table<LocalTransactionCategory>;
  transactiongroups!: Table<LocalTransactionGroup>;
  configurations!: Table<LocalConfiguration>;
  recurrings!: Table<LocalRecurring>;

  constructor() {
    super('BudgeteerDB');
    
    // Define schemas for each table matching database.types.ts exactly with optimized indexing
    this.version(1).stores({
      // Accounts table - all fields from database.types.ts with optimized indexes
      accounts: 'id, tenantid, categoryid, name, isdeleted, balance, displayorder, createdat, updatedat, owner, currency, color, icon, description, notes, createdby, updatedby, [tenantid+isdeleted], [categoryid+isdeleted], [tenantid+categoryid], [tenantid+displayorder]',
      
      // Account categories table - all fields with proper indexing
      accountcategories: 'id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, color, icon, createdby, updatedby, [tenantid+isdeleted], [tenantid+type], [tenantid+displayorder]',
      
      // Transactions table - most complex queries with comprehensive indexing
      transactions: 'id, tenantid, accountid, categoryid, date, isdeleted, amount, type, createdat, updatedat, payee, transferaccountid, transferid, isvoid, name, description, notes, tags, createdby, updatedby, [tenantid+isdeleted], [accountid+isdeleted], [categoryid+isdeleted], [tenantid+date], [accountid+date], [categoryid+date], [tenantid+accountid], [tenantid+categoryid], [transferaccountid+isdeleted]',
      
      // Transaction categories table - all fields with proper foreign key indexing
      transactioncategories: 'id, tenantid, groupid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency, color, icon, description, createdby, updatedby, [tenantid+isdeleted], [groupid+isdeleted], [tenantid+type], [tenantid+groupid], [tenantid+displayorder]',
      
      // Transaction groups table - all fields with proper indexing
      transactiongroups: 'id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency, color, icon, description, createdby, updatedby, [tenantid+isdeleted], [tenantid+type], [tenantid+displayorder]',
      
      // Configurations table - all fields with proper compound indexing
      configurations: 'id, tenantid, key, table, isdeleted, createdat, updatedat, type, value, createdby, updatedby, [tenantid+key], [table+key], [tenantid+table], [tenantid+isdeleted]',
      
      // Recurrings table - all fields from database.types.ts with proper indexing
      recurrings: 'id, tenantid, sourceaccountid, categoryid, isdeleted, nextoccurrencedate, createdat, updatedat, isactive, lastexecutedat, type, name, amount, currencycode, description, enddate, notes, payeename, recurrencerule, createdby, updatedby, [tenantid+isdeleted], [sourceaccountid+isdeleted], [categoryid+isdeleted], [tenantid+nextoccurrencedate], [tenantid+isactive], [tenantid+sourceaccountid]'
    });

    // Add hooks for referential integrity validation and automatic timestamp management
    this.accounts.hook('creating', async (primKey, obj, trans) => {
      await this.validateAccountCreation(obj, trans);
      this.setTimestamps(obj);
    });

    this.accounts.hook('updating', async (modifications, primKey, obj, trans) => {
      await this.validateAccountUpdate(modifications, obj, trans);
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.accountcategories.hook('creating', (_, obj) => {
      this.setTimestamps(obj);
    });

    this.accountcategories.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactions.hook('creating', async (primKey, obj, trans) => {
      await this.validateTransactionCreation(obj, trans);
      this.setTimestamps(obj);
    });

    this.transactions.hook('updating', async (modifications, primKey, obj, trans) => {
      await this.validateTransactionUpdate(modifications, obj, trans);
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactioncategories.hook('creating', async (primKey, obj, trans) => {
      await this.validateTransactionCategoryCreation(obj, trans);
      this.setTimestamps(obj);
    });

    this.transactioncategories.hook('updating', async (modifications, primKey, obj, trans) => {
      await this.validateTransactionCategoryUpdate(modifications, obj, trans);
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactiongroups.hook('creating', (_, obj) => {
      this.setTimestamps(obj);
    });

    this.transactiongroups.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.configurations.hook('creating', (_, obj) => {
      this.setTimestamps(obj);
    });

    this.configurations.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.recurrings.hook('creating', async (primKey, obj, trans) => {
      await this.validateRecurringCreation(obj, trans);
      this.setTimestamps(obj);
    });

    this.recurrings.hook('updating', async (modifications, primKey, obj, trans) => {
      await this.validateRecurringUpdate(modifications, obj, trans);
      (modifications as any).updatedat = new Date().toISOString();
    });
  }

  // Helper method for setting timestamps
  private setTimestamps(obj: any): void {
    const now = new Date().toISOString();
    obj.createdat = obj.createdat || now;
    obj.updatedat = obj.updatedat || now;
  }

  // Referential integrity validation methods
  private async validateAccountCreation(obj: any, trans: any): Promise<void> {
    if (obj.categoryid) {
      const category = await trans.table('accountcategories').get(obj.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('accountcategories', 'id', obj.categoryid, {
          operation: 'create',
          table: 'accounts'
        });
      }
    }
  }

  private async validateAccountUpdate(modifications: any, obj: any, trans: any): Promise<void> {
    if (modifications.categoryid) {
      const category = await trans.table('accountcategories').get(modifications.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('accountcategories', 'id', modifications.categoryid, {
          operation: 'update',
          table: 'accounts'
        });
      }
    }
  }

  private async validateTransactionCreation(obj: any, trans: any): Promise<void> {
    // Validate accountid
    if (obj.accountid) {
      const account = await trans.table('accounts').get(obj.accountid);
      if (!account || account.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', obj.accountid, {
          operation: 'create',
          table: 'transactions'
        });
      }
    }

    // Validate categoryid
    if (obj.categoryid) {
      const category = await trans.table('transactioncategories').get(obj.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', obj.categoryid, {
          operation: 'create',
          table: 'transactions'
        });
      }
    }

    // Validate transferaccountid if present
    if (obj.transferaccountid) {
      const transferAccount = await trans.table('accounts').get(obj.transferaccountid);
      if (!transferAccount || transferAccount.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', obj.transferaccountid, {
          operation: 'create',
          table: 'transactions',
          field: 'transferaccountid'
        });
      }
    }

    // Validate transferid if present
    if (obj.transferid) {
      const transferTransaction = await trans.table('transactions').get(obj.transferid);
      if (!transferTransaction || transferTransaction.isdeleted) {
        throw new ReferentialIntegrityError('transactions', 'id', obj.transferid, {
          operation: 'create',
          table: 'transactions',
          field: 'transferid'
        });
      }
    }
  }

  private async validateTransactionUpdate(modifications: any, obj: any, trans: any): Promise<void> {
    // Validate accountid if being updated
    if (modifications.accountid) {
      const account = await trans.table('accounts').get(modifications.accountid);
      if (!account || account.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', modifications.accountid, {
          operation: 'update',
          table: 'transactions'
        });
      }
    }

    // Validate categoryid if being updated
    if (modifications.categoryid) {
      const category = await trans.table('transactioncategories').get(modifications.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', modifications.categoryid, {
          operation: 'update',
          table: 'transactions'
        });
      }
    }

    // Validate transferaccountid if being updated
    if (modifications.transferaccountid) {
      const transferAccount = await trans.table('accounts').get(modifications.transferaccountid);
      if (!transferAccount || transferAccount.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', modifications.transferaccountid, {
          operation: 'update',
          table: 'transactions',
          field: 'transferaccountid'
        });
      }
    }

    // Validate transferid if being updated
    if (modifications.transferid) {
      const transferTransaction = await trans.table('transactions').get(modifications.transferid);
      if (!transferTransaction || transferTransaction.isdeleted) {
        throw new ReferentialIntegrityError('transactions', 'id', modifications.transferid, {
          operation: 'update',
          table: 'transactions',
          field: 'transferid'
        });
      }
    }
  }

  private async validateTransactionCategoryCreation(obj: any, trans: any): Promise<void> {
    if (obj.groupid) {
      const group = await trans.table('transactiongroups').get(obj.groupid);
      if (!group || group.isdeleted) {
        throw new ReferentialIntegrityError('transactiongroups', 'id', obj.groupid, {
          operation: 'create',
          table: 'transactioncategories'
        });
      }
    }
  }

  private async validateTransactionCategoryUpdate(modifications: any, obj: any, trans: any): Promise<void> {
    if (modifications.groupid) {
      const group = await trans.table('transactiongroups').get(modifications.groupid);
      if (!group || group.isdeleted) {
        throw new ReferentialIntegrityError('transactiongroups', 'id', modifications.groupid, {
          operation: 'update',
          table: 'transactioncategories'
        });
      }
    }
  }

  private async validateRecurringCreation(obj: any, trans: any): Promise<void> {
    // Validate sourceaccountid
    if (obj.sourceaccountid) {
      const account = await trans.table('accounts').get(obj.sourceaccountid);
      if (!account || account.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', obj.sourceaccountid, {
          operation: 'create',
          table: 'recurrings',
          field: 'sourceaccountid'
        });
      }
    }

    // Validate categoryid if present
    if (obj.categoryid) {
      const category = await trans.table('transactioncategories').get(obj.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', obj.categoryid, {
          operation: 'create',
          table: 'recurrings'
        });
      }
    }
  }

  private async validateRecurringUpdate(modifications: any, obj: any, trans: any): Promise<void> {
    // Validate sourceaccountid if being updated
    if (modifications.sourceaccountid) {
      const account = await trans.table('accounts').get(modifications.sourceaccountid);
      if (!account || account.isdeleted) {
        throw new ReferentialIntegrityError('accounts', 'id', modifications.sourceaccountid, {
          operation: 'update',
          table: 'recurrings',
          field: 'sourceaccountid'
        });
      }
    }

    // Validate categoryid if being updated
    if (modifications.categoryid) {
      const category = await trans.table('transactioncategories').get(modifications.categoryid);
      if (!category || category.isdeleted) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', modifications.categoryid, {
          operation: 'update',
          table: 'recurrings'
        });
      }
    }
  }

  // Enhanced error handling for Dexie operations
  private handleDexieError(error: any, operation: string, table?: string, details?: any): never {
    console.error(`Dexie operation failed: ${operation}`, error, details);

    // Map Dexie-specific errors to StorageError types
    if (error.name === 'QuotaExceededError') {
      throw new StorageError(
        'Storage quota exceeded',
        StorageErrorCode.QUOTA_EXCEEDED,
        { operation, table, originalError: error, ...details }
      );
    }

    if (error.name === 'DatabaseClosedError') {
      throw new StorageError(
        'Database connection closed',
        StorageErrorCode.STORAGE_CONNECTION_FAILED,
        { operation, table, originalError: error, ...details }
      );
    }

    if (error.name === 'InvalidStateError') {
      throw new StorageError(
        'Invalid database state',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        { operation, table, originalError: error, ...details }
      );
    }

    if (error.name === 'ConstraintError') {
      throw new StorageError(
        'Database constraint violation',
        StorageErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
        { operation, table, originalError: error, ...details }
      );
    }

    // Handle referential integrity errors (already thrown by our hooks)
    if (error instanceof ReferentialIntegrityError) {
      throw error;
    }

    // Default error mapping
    throw new StorageError(
      error.message || 'Unknown database error',
      StorageErrorCode.STORAGE_OPERATION_FAILED,
      { operation, table, originalError: error, ...details }
    );
  }

  // Enhanced query methods with proper error handling
  async safeQuery<T>(
    operation: () => Promise<T>,
    operationName: string,
    table?: string,
    details?: any
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleDexieError(error, operationName, table, details);
    }
  }

  // Migration support for future database updates
  async migrate(): Promise<void> {
    try {
      console.log('Starting database migration...');
      
      // Check current version and run necessary migrations
      const currentVersion = this.verno;
      console.log(`Current database version: ${currentVersion}`);
      
      // Future migrations will be added here based on version
      // Example:
      // if (currentVersion < 2) {
      //   await this.runMigrationV2();
      // }
      
      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Database migration failed:', error);
      throw new StorageError(
        'Database migration failed',
        StorageErrorCode.MIGRATION_FAILED,
        { originalError: error as Error }
      );
    }
  }

  // Utility method for cascade delete operations
  async cascadeDelete(table: string, recordId: string, tenantId: string): Promise<void> {
    try {
      await this.transaction('rw', this.accounts, this.transactions, this.recurrings, async () => {
        switch (table) {
          case 'accounts':
            // Mark related transactions as deleted
            await this.transactions
              .where('accountid')
              .equals(recordId)
              .modify({ isdeleted: true, updatedat: new Date().toISOString() });
            
            // Mark related recurrings as deleted
            await this.recurrings
              .where('sourceaccountid')
              .equals(recordId)
              .modify({ isdeleted: true, updatedat: new Date().toISOString() });
            break;

          case 'transactioncategories':
            // Mark related transactions as deleted
            await this.transactions
              .where('categoryid')
              .equals(recordId)
              .modify({ isdeleted: true, updatedat: new Date().toISOString() });
            
            // Mark related recurrings as deleted
            await this.recurrings
              .where('categoryid')
              .equals(recordId)
              .modify({ isdeleted: true, updatedat: new Date().toISOString() });
            break;

          case 'transactiongroups':
            // Mark related transaction categories as deleted
            await this.transactioncategories
              .where('groupid')
              .equals(recordId)
              .modify({ isdeleted: true, updatedat: new Date().toISOString() });
            break;
        }
      });
    } catch (error) {
      this.handleDexieError(error, 'cascadeDelete', table, { recordId, tenantId });
    }
  }
}

// Create and export a singleton instance
export const db = new BudgeteerDatabase();