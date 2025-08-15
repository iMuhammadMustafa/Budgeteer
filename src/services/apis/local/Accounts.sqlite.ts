import { IAccountProvider } from '../../../types/storage/providers/IAccountProvider';
import { 
  ReferentialIntegrityError, 
  StorageError, 
  StorageErrorCode,
  withStorageErrorHandling 
} from '../../storage/errors';
import { sqliteDb, LocalAccount } from './BudgeteerSQLiteDatabase';
import { Database } from '../../../types/db/database.types';
import { SQLiteErrorMapper } from './SQLiteErrorMapper';
import { StorageMode } from '../../../types/storage/StorageTypes';
import { Account, Inserts, Updates } from '../../../types/db/Tables.Types';
import { TableNames } from '../../../types/db/TableNames';
import { v4 as uuidv4 } from 'uuid';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export class SQLiteAccountProvider implements IAccountProvider {
  readonly mode: StorageMode = 'local';
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllAccounts(tenantId: string): Promise<Account[]> {
    return withStorageErrorHandling(
      async () => {
        try {
          const accounts = await this.db.getAllAsync(
            'SELECT * FROM accounts WHERE tenantid = ? AND isdeleted = 0 ORDER BY displayorder, name',
            [tenantId]
          ) as LocalAccount[];
          
          return accounts as Account[];
        } catch (error) {
          console.error('Error getting all accounts:', error);
          throw SQLiteErrorMapper.mapError(error, 'getAllAccounts', 'SELECT');
        }
      },
      {
        storageMode: 'local',
        operation: 'getAllAccounts',
        table: 'accounts',
        tenantId
      }
    );
  }

  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    return withStorageErrorHandling(
      async () => {
        try {
          const account = await this.db.getFirstAsync(
            'SELECT * FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
            [id, tenantId]
          ) as LocalAccount | null;
          
          return account as Account | null;
        } catch (error) {
          console.error('Error getting account by id:', error);
          throw SQLiteErrorMapper.mapError(error, 'getAccountById', 'SELECT');
        }
      },
      {
        storageMode: 'local',
        operation: 'getAccountById',
        table: 'accounts',
        recordId: id,
        tenantId
      }
    );
  }

  async createAccount(accountData: Inserts<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          // Validate required fields
          if (!accountData.name) {
            throw new StorageError(
              'Account name is required',
              StorageErrorCode.MISSING_REQUIRED_FIELD,
              { field: 'name', table: 'accounts' }
            );
          }

          if (!accountData.categoryid) {
            throw new StorageError(
              'Account category ID is required',
              StorageErrorCode.MISSING_REQUIRED_FIELD,
              { field: 'categoryid', table: 'accounts' }
            );
          }

          // Validate foreign key constraints explicitly
          const categoryExists = await this.db.getFirstAsync(
            'SELECT id FROM accountcategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
            [accountData.categoryid, accountData.tenantid || '']
          );
          
          if (!categoryExists) {
            throw new ReferentialIntegrityError('accountcategories', 'id', accountData.categoryid);
          }

          const account: LocalAccount = {
            id: accountData.id || uuidv4(),
            tenantid: accountData.tenantid || '',
            categoryid: accountData.categoryid,
            name: accountData.name,
            balance: accountData.balance || 0,
            color: accountData.color || '#000000',
            icon: accountData.icon || 'wallet',
            currency: accountData.currency || 'USD',
            description: accountData.description || null,
            notes: accountData.notes || null,
            owner: accountData.owner || null,
            displayorder: accountData.displayorder || 0,
            isdeleted: accountData.isdeleted || false,
            createdat: accountData.createdat || new Date().toISOString(),
            createdby: accountData.createdby || null,
            updatedat: accountData.updatedat || new Date().toISOString(),
            updatedby: accountData.updatedby || null
          };

          await this.db.runAsync(
            `INSERT INTO accounts (
              id, tenantid, categoryid, name, balance, color, icon, currency, 
              description, notes, owner, displayorder, isdeleted, createdat, 
              createdby, updatedat, updatedby
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              account.id, account.tenantid, account.categoryid, account.name,
              account.balance, account.color, account.icon, account.currency,
              account.description, account.notes, account.owner, account.displayorder,
              account.isdeleted ? 1 : 0, account.createdat, account.createdby,
              account.updatedat, account.updatedby
            ]
          );

          return account;
        } catch (error) {
          console.error('Error creating account:', error);
          if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
            throw error;
          }
          throw SQLiteErrorMapper.mapError(error, 'createAccount', 'INSERT');
        }
      },
      {
        storageMode: 'local',
        operation: 'createAccount',
        table: 'accounts',
        tenantId: accountData.tenantid
      }
    );
  }

  async updateAccount(accountData: Updates<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          if (!accountData.id) {
            throw new StorageError(
              'Account ID is required for update',
              StorageErrorCode.MISSING_REQUIRED_FIELD,
              { field: 'id', table: 'accounts' }
            );
          }

          // Get current account to merge with updates
          const currentAccount = await this.db.getFirstAsync(
            'SELECT * FROM accounts WHERE id = ?',
            [accountData.id]
          ) as LocalAccount;

          if (!currentAccount) {
            throw new StorageError(
              'Account not found',
              StorageErrorCode.RECORD_NOT_FOUND,
              { recordId: accountData.id, table: 'accounts' }
            );
          }

          // Validate foreign key constraints if categoryid is being updated
          if (accountData.categoryid && accountData.categoryid !== currentAccount.categoryid) {
            const categoryExists = await this.db.getFirstAsync(
              'SELECT id FROM accountcategories WHERE id = ? AND isdeleted = 0',
              [accountData.categoryid]
            );
            
            if (!categoryExists) {
              throw new ReferentialIntegrityError('accountcategories', 'id', accountData.categoryid);
            }
          }

          const updatedAccount: LocalAccount = {
            ...currentAccount,
            ...accountData,
            updatedat: new Date().toISOString()
          };

          await this.db.runAsync(
            `UPDATE accounts SET 
              tenantid = ?, categoryid = ?, name = ?, balance = ?, color = ?, 
              icon = ?, currency = ?, description = ?, notes = ?, owner = ?, 
              displayorder = ?, isdeleted = ?, updatedat = ?, updatedby = ?
            WHERE id = ?`,
            [
              updatedAccount.tenantid, updatedAccount.categoryid, updatedAccount.name,
              updatedAccount.balance, updatedAccount.color, updatedAccount.icon,
              updatedAccount.currency, updatedAccount.description, updatedAccount.notes,
              updatedAccount.owner, updatedAccount.displayorder, updatedAccount.isdeleted ? 1 : 0,
              updatedAccount.updatedat, updatedAccount.updatedby, updatedAccount.id
            ]
          );

          return updatedAccount;
        } catch (error) {
          console.error('Error updating account:', error);
          if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
            throw error;
          }
          throw SQLiteErrorMapper.mapError(error, 'updateAccount', 'UPDATE');
        }
      },
      {
        storageMode: 'local',
        operation: 'updateAccount',
        table: 'accounts',
        recordId: accountData.id,
        tenantId: accountData.tenantid
      }
    );
  }

  async deleteAccount(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          const account = await this.db.getFirstAsync(
            'SELECT * FROM accounts WHERE id = ?',
            [id]
          ) as LocalAccount;

          if (!account) {
            throw new StorageError(
              'Account not found',
              StorageErrorCode.RECORD_NOT_FOUND,
              { recordId: id, table: 'accounts' }
            );
          }

          // Check for dependent records that would prevent deletion
          const dependentTransactions = await this.db.getFirstAsync(
            'SELECT COUNT(*) as count FROM transactions WHERE accountid = ? AND isdeleted = 0',
            [id]
          ) as { count: number };

          if (dependentTransactions.count > 0) {
            throw new StorageError(
              'Cannot delete account with existing transactions',
              StorageErrorCode.REFERENTIAL_INTEGRITY_ERROR,
              { 
                recordId: id, 
                table: 'accounts',
                dependentRecords: dependentTransactions.count,
                dependentTable: 'transactions'
              }
            );
          }

          const deletedAccount: LocalAccount = {
            ...account,
            isdeleted: true,
            updatedat: new Date().toISOString(),
            updatedby: userId || null
          };

          await this.db.runAsync(
            'UPDATE accounts SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
            [deletedAccount.updatedat, deletedAccount.updatedby, id]
          );

          return deletedAccount;
        } catch (error) {
          console.error('Error deleting account:', error);
          if (error instanceof StorageError) {
            throw error;
          }
          throw SQLiteErrorMapper.mapError(error, 'deleteAccount', 'UPDATE');
        }
      },
      {
        storageMode: 'local',
        operation: 'deleteAccount',
        table: 'accounts',
        recordId: id
      }
    );
  }

  async restoreAccount(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          const account = await this.db.getFirstAsync(
            'SELECT * FROM accounts WHERE id = ?',
            [id]
          ) as LocalAccount;

          if (!account) {
            throw new StorageError(
              'Account not found',
              StorageErrorCode.RECORD_NOT_FOUND,
              { recordId: id, table: 'accounts' }
            );
          }

          const restoredAccount: LocalAccount = {
            ...account,
            isdeleted: false,
            updatedat: new Date().toISOString(),
            updatedby: userId || null
          };

          await this.db.runAsync(
            'UPDATE accounts SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
            [restoredAccount.updatedat, restoredAccount.updatedby, id]
          );

          return restoredAccount;
        } catch (error) {
          console.error('Error restoring account:', error);
          if (error instanceof StorageError) {
            throw error;
          }
          throw SQLiteErrorMapper.mapError(error, 'restoreAccount', 'UPDATE');
        }
      },
      {
        storageMode: 'local',
        operation: 'restoreAccount',
        table: 'accounts',
        recordId: id
      }
    );
  }

  async updateAccountBalance(accountid: string, amount: number): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          const account = await this.db.getFirstAsync(
            'SELECT * FROM accounts WHERE id = ?',
            [accountid]
          ) as LocalAccount;

          if (!account) {
            throw new StorageError(
              'Account not found',
              StorageErrorCode.RECORD_NOT_FOUND,
              { recordId: accountid, table: 'accounts' }
            );
          }

          const newBalance = account.balance + amount;
          const updatedAccount: LocalAccount = {
            ...account,
            balance: newBalance,
            updatedat: new Date().toISOString()
          };

          await this.db.runAsync(
            'UPDATE accounts SET balance = ?, updatedat = ? WHERE id = ?',
            [updatedAccount.balance, updatedAccount.updatedat, accountid]
          );

          return updatedAccount;
        } catch (error) {
          console.error('Error updating account balance:', error);
          if (error instanceof StorageError) {
            throw error;
          }
          throw SQLiteErrorMapper.mapError(error, 'updateAccountBalance', 'UPDATE');
        }
      },
      {
        storageMode: 'local',
        operation: 'updateAccountBalance',
        table: 'accounts',
        recordId: accountid
      }
    );
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        try {
          // Get the earliest transaction for this account (opening balance transaction)
          const openingTransaction = await this.db.getFirstAsync(
            `SELECT * FROM transactions 
             WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 
             ORDER BY date ASC, createdat ASC 
             LIMIT 1`,
            [accountid, tenantId]
          );
          
          return openingTransaction || null;
        } catch (error) {
          console.error('Error getting account opened transaction:', error);
          throw SQLiteErrorMapper.mapError(error, 'getAccountOpenedTransaction', 'SELECT');
        }
      },
      {
        storageMode: 'local',
        operation: 'getAccountOpenedTransaction',
        table: 'transactions',
        recordId: accountid,
        tenantId
      }
    );
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    return withStorageErrorHandling(
      async () => {
        try {
          const result = await this.db.getFirstAsync(
            'SELECT COALESCE(SUM(balance), 0) as totalbalance FROM accounts WHERE tenantid = ? AND isdeleted = 0',
            [tenantId]
          ) as { totalbalance: number } | null;

          return result || { totalbalance: 0 };
        } catch (error) {
          console.error('Error getting total account balance:', error);
          throw SQLiteErrorMapper.mapError(error, 'getTotalAccountBalance', 'SELECT');
        }
      },
      {
        storageMode: 'local',
        operation: 'getTotalAccountBalance',
        table: 'accounts',
        tenantId
      }
    );
  }
}

export const sqliteAccountProvider = new SQLiteAccountProvider();