import { ITransactionProvider, ReferentialIntegrityError, StorageError } from '../../storage/types';
import { sqliteDb, LocalTransaction } from './BudgeteerSQLiteDatabase';
import { Database } from '@/src/types/db/database.types';
import { v4 as uuidv4 } from 'uuid';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export class SQLiteTransactionProvider implements ITransactionProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllTransactions(tenantId: string): Promise<LocalTransaction[]> {
    try {
      const transactions = await this.db.getAllAsync(
        'SELECT * FROM transactions WHERE tenantid = ? AND isdeleted = 0 ORDER BY date DESC, createdat DESC',
        [tenantId]
      ) as LocalTransaction[];
      
      // Parse tags JSON string back to array
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? JSON.parse(t.tags as string) : null
      }));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw new StorageError('Failed to get transactions', 'GET_TRANSACTIONS_ERROR', error);
    }
  }

  async getTransactionById(id: string, tenantId: string): Promise<LocalTransaction | null> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalTransaction | null;
      
      if (transaction && transaction.tags) {
        transaction.tags = JSON.parse(transaction.tags as string);
      }
      
      return transaction;
    } catch (error) {
      console.error('Error getting transaction by id:', error);
      throw new StorageError('Failed to get transaction', 'GET_TRANSACTION_ERROR', error);
    }
  }

  async createTransaction(transactionData: TransactionInsert): Promise<LocalTransaction> {
    try {
      // Validate foreign key constraints
      if (transactionData.accountid) {
        const accountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [transactionData.accountid, transactionData.tenantid || '']
        );
        
        if (!accountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', transactionData.accountid);
        }
      }

      if (transactionData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM transactioncategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [transactionData.categoryid, transactionData.tenantid || '']
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('transactioncategories', 'id', transactionData.categoryid);
        }
      }

      if (transactionData.transferaccountid) {
        const transferAccountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
          [transactionData.transferaccountid, transactionData.tenantid || '']
        );
        
        if (!transferAccountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', transactionData.transferaccountid);
        }
      }

      const transaction: LocalTransaction = {
        id: transactionData.id || uuidv4(),
        tenantid: transactionData.tenantid || '',
        accountid: transactionData.accountid,
        categoryid: transactionData.categoryid,
        date: transactionData.date,
        amount: transactionData.amount || 0,
        type: transactionData.type || 'expense',
        name: transactionData.name || null,
        description: transactionData.description || null,
        notes: transactionData.notes || null,
        payee: transactionData.payee || null,
        tags: transactionData.tags || null,
        transferaccountid: transactionData.transferaccountid || null,
        transferid: transactionData.transferid || null,
        isdeleted: transactionData.isdeleted || false,
        isvoid: transactionData.isvoid || false,
        createdat: transactionData.createdat || new Date().toISOString(),
        createdby: transactionData.createdby || null,
        updatedat: transactionData.updatedat || new Date().toISOString(),
        updatedby: transactionData.updatedby || null
      };

      // Convert tags array to JSON string for storage
      const tagsJson = transaction.tags ? JSON.stringify(transaction.tags) : null;

      await this.db.runAsync(
        `INSERT INTO transactions (
          id, tenantid, accountid, categoryid, date, amount, type, name, 
          description, notes, payee, tags, transferaccountid, transferid, 
          isdeleted, isvoid, createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id, transaction.tenantid, transaction.accountid, transaction.categoryid,
          transaction.date, transaction.amount, transaction.type, transaction.name,
          transaction.description, transaction.notes, transaction.payee, tagsJson,
          transaction.transferaccountid, transaction.transferid, transaction.isdeleted ? 1 : 0,
          transaction.isvoid ? 1 : 0, transaction.createdat, transaction.createdby,
          transaction.updatedat, transaction.updatedby
        ]
      );

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      if (error instanceof ReferentialIntegrityError) {
        throw error;
      }
      throw new StorageError('Failed to create transaction', 'CREATE_TRANSACTION_ERROR', error);
    }
  }

  async updateTransaction(transactionData: TransactionUpdate): Promise<LocalTransaction> {
    try {
      if (!transactionData.id) {
        throw new StorageError('Transaction ID is required for update', 'MISSING_ID_ERROR');
      }

      // Validate foreign key constraints if they are being updated
      if (transactionData.accountid) {
        const accountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND isdeleted = 0',
          [transactionData.accountid]
        );
        
        if (!accountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', transactionData.accountid);
        }
      }

      if (transactionData.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM transactioncategories WHERE id = ? AND isdeleted = 0',
          [transactionData.categoryid]
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('transactioncategories', 'id', transactionData.categoryid);
        }
      }

      // Get current transaction to merge with updates
      const currentTransaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionData.id]
      ) as LocalTransaction;

      if (!currentTransaction) {
        throw new StorageError('Transaction not found', 'TRANSACTION_NOT_FOUND');
      }

      // Parse current tags if they exist
      if (currentTransaction.tags && typeof currentTransaction.tags === 'string') {
        currentTransaction.tags = JSON.parse(currentTransaction.tags);
      }

      const updatedTransaction: LocalTransaction = {
        ...currentTransaction,
        ...transactionData,
        updatedat: new Date().toISOString()
      };

      // Convert tags array to JSON string for storage
      const tagsJson = updatedTransaction.tags ? JSON.stringify(updatedTransaction.tags) : null;

      await this.db.runAsync(
        `UPDATE transactions SET 
          tenantid = ?, accountid = ?, categoryid = ?, date = ?, amount = ?, 
          type = ?, name = ?, description = ?, notes = ?, payee = ?, tags = ?, 
          transferaccountid = ?, transferid = ?, isdeleted = ?, isvoid = ?, 
          updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedTransaction.tenantid, updatedTransaction.accountid, updatedTransaction.categoryid,
          updatedTransaction.date, updatedTransaction.amount, updatedTransaction.type,
          updatedTransaction.name, updatedTransaction.description, updatedTransaction.notes,
          updatedTransaction.payee, tagsJson, updatedTransaction.transferaccountid,
          updatedTransaction.transferid, updatedTransaction.isdeleted ? 1 : 0,
          updatedTransaction.isvoid ? 1 : 0, updatedTransaction.updatedat,
          updatedTransaction.updatedby, updatedTransaction.id
        ]
      );

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update transaction', 'UPDATE_TRANSACTION_ERROR', error);
    }
  }

  async deleteTransaction(id: string, userId?: string): Promise<LocalTransaction> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      ) as LocalTransaction;

      if (!transaction) {
        throw new StorageError('Transaction not found', 'TRANSACTION_NOT_FOUND');
      }

      // Parse tags if they exist
      if (transaction.tags && typeof transaction.tags === 'string') {
        transaction.tags = JSON.parse(transaction.tags);
      }

      const deletedTransaction: LocalTransaction = {
        ...transaction,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactions SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedTransaction.updatedat, deletedTransaction.updatedby, id]
      );

      return deletedTransaction;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete transaction', 'DELETE_TRANSACTION_ERROR', error);
    }
  }

  async restoreTransaction(id: string, userId?: string): Promise<LocalTransaction> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      ) as LocalTransaction;

      if (!transaction) {
        throw new StorageError('Transaction not found', 'TRANSACTION_NOT_FOUND');
      }

      // Parse tags if they exist
      if (transaction.tags && typeof transaction.tags === 'string') {
        transaction.tags = JSON.parse(transaction.tags);
      }

      const restoredTransaction: LocalTransaction = {
        ...transaction,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE transactions SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredTransaction.updatedat, restoredTransaction.updatedby, id]
      );

      return restoredTransaction;
    } catch (error) {
      console.error('Error restoring transaction:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore transaction', 'RESTORE_TRANSACTION_ERROR', error);
    }
  }

  async getTransactionsByAccount(accountId: string, tenantId: string): Promise<LocalTransaction[]> {
    try {
      const transactions = await this.db.getAllAsync(
        'SELECT * FROM transactions WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 ORDER BY date DESC, createdat DESC',
        [accountId, tenantId]
      ) as LocalTransaction[];
      
      // Parse tags JSON string back to array
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? JSON.parse(t.tags as string) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by account:', error);
      throw new StorageError('Failed to get transactions by account', 'GET_TRANSACTIONS_BY_ACCOUNT_ERROR', error);
    }
  }

  async getTransactionsByCategory(categoryId: string, tenantId: string): Promise<LocalTransaction[]> {
    try {
      const transactions = await this.db.getAllAsync(
        'SELECT * FROM transactions WHERE categoryid = ? AND tenantid = ? AND isdeleted = 0 ORDER BY date DESC, createdat DESC',
        [categoryId, tenantId]
      ) as LocalTransaction[];
      
      // Parse tags JSON string back to array
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? JSON.parse(t.tags as string) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      throw new StorageError('Failed to get transactions by category', 'GET_TRANSACTIONS_BY_CATEGORY_ERROR', error);
    }
  }

  async getTransactionsByDateRange(startDate: string, endDate: string, tenantId: string): Promise<LocalTransaction[]> {
    try {
      const transactions = await this.db.getAllAsync(
        'SELECT * FROM transactions WHERE date >= ? AND date <= ? AND tenantid = ? AND isdeleted = 0 ORDER BY date DESC, createdat DESC',
        [startDate, endDate, tenantId]
      ) as LocalTransaction[];
      
      // Parse tags JSON string back to array
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? JSON.parse(t.tags as string) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw new StorageError('Failed to get transactions by date range', 'GET_TRANSACTIONS_BY_DATE_RANGE_ERROR', error);
    }
  }
}

export const sqliteTransactionProvider = new SQLiteTransactionProvider();