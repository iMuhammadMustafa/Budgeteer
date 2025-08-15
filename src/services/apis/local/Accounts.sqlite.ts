import { IAccountProvider, ReferentialIntegrityError, StorageError, StorageErrorCode } from '../../storage/types';
import { sqliteDb, LocalAccount } from './BudgeteerSQLiteDatabase';
import { Database } from '@/src/types/db/database.types';
import { SQLiteErrorMapper } from './SQLiteErrorMapper';
import { v4 as uuidv4 } from 'uuid';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export class SQLiteAccountProvider implements IAccountProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllAccounts(tenantId: string): Promise<LocalAccount[]> {
    try {
      const accounts = await this.db.getAllAsync(
        'SELECT * FROM accounts WHERE tenantid = ? AND isdeleted = 0 ORDER BY displayorder, name',
        [tenantId]
      ) as LocalAccount[];
      
      return accounts;
    } catch (error) {
      console.error('Error getting all accounts:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAllAccounts', 'SELECT');
    }
  }

  async getAccountById(id: string, tenantId: string): Promise<LocalAccount | null> {
    try {
      const account = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalAccount | null;
      
      return account;
    } catch (error) {
      console.error('Error getting account by id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAccountById', 'SELECT');
    }
  }

  async createAccount(accountData: AccountInsert): Promise<LocalAccount> {
    try {
      // Validate foreign key constraints
      if (accountData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM accountcategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [accountData.categoryid, accountData.tenantid || '']
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('accountcategories', 'id', accountData.categoryid);
        }
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
      if (error instanceof ReferentialIntegrityError) {
        throw error;
      }
      throw new StorageError('Failed to create account', 'CREATE_ACCOUNT_ERROR', error);
    }
  }

  async updateAccount(accountData: AccountUpdate): Promise<LocalAccount> {
    try {
      if (!accountData.id) {
        throw new StorageError('Account ID is required for update', 'MISSING_ID_ERROR');
      }

      // Validate foreign key constraints if categoryid is being updated
      if (accountData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM accountcategories WHERE id = ? AND isdeleted = 0',
          [accountData.categoryid]
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('accountcategories', 'id', accountData.categoryid);
        }
      }

      // Get current account to merge with updates
      const currentAccount = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ?',
        [accountData.id]
      ) as LocalAccount;

      if (!currentAccount) {
        throw new StorageError('Account not found', 'ACCOUNT_NOT_FOUND');
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
      throw new StorageError('Failed to update account', 'UPDATE_ACCOUNT_ERROR', error);
    }
  }

  async deleteAccount(id: string, userId?: string): Promise<LocalAccount> {
    try {
      const account = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ?',
        [id]
      ) as LocalAccount;

      if (!account) {
        throw new StorageError('Account not found', 'ACCOUNT_NOT_FOUND');
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
      throw new StorageError('Failed to delete account', 'DELETE_ACCOUNT_ERROR', error);
    }
  }

  async restoreAccount(id: string, userId?: string): Promise<LocalAccount> {
    try {
      const account = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ?',
        [id]
      ) as LocalAccount;

      if (!account) {
        throw new StorageError('Account not found', 'ACCOUNT_NOT_FOUND');
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
      throw new StorageError('Failed to restore account', 'RESTORE_ACCOUNT_ERROR', error);
    }
  }

  async updateAccountBalance(accountId: string, amount: number): Promise<LocalAccount> {
    try {
      const account = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ?',
        [accountId]
      ) as LocalAccount;

      if (!account) {
        throw new StorageError('Account not found', 'ACCOUNT_NOT_FOUND');
      }

      const updatedAccount: LocalAccount = {
        ...account,
        balance: account.balance + amount,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        'UPDATE accounts SET balance = ?, updatedat = ? WHERE id = ?',
        [updatedAccount.balance, updatedAccount.updatedat, accountId]
      );

      return updatedAccount;
    } catch (error) {
      console.error('Error updating account balance:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update account balance', 'UPDATE_BALANCE_ERROR', error);
    }
  }

  async getAccountOpenedTransaction(accountId: string, tenantId: string): Promise<any> {
    try {
      // This would typically return the opening balance transaction
      // For now, return null as this is a complex query that may need specific business logic
      return null;
    } catch (error) {
      console.error('Error getting account opened transaction:', error);
      throw new StorageError('Failed to get account opened transaction', 'GET_OPENED_TRANSACTION_ERROR', error);
    }
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT SUM(balance) as totalbalance FROM accounts WHERE tenantid = ? AND isdeleted = 0',
        [tenantId]
      ) as { totalbalance: number } | null;

      return result || { totalbalance: 0 };
    } catch (error) {
      console.error('Error getting total account balance:', error);
      throw new StorageError('Failed to get total account balance', 'GET_TOTAL_BALANCE_ERROR', error);
    }
  }
}

export const sqliteAccountProvider = new SQLiteAccountProvider();