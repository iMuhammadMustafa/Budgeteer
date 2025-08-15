import { ITransactionProvider, ReferentialIntegrityError, StorageError, StorageErrorCode } from '../../storage/types';
import { sqliteDb, LocalTransaction } from './BudgeteerSQLiteDatabase';
import { Database } from '../../../types/db/database.types';
import { SQLiteErrorMapper } from './SQLiteErrorMapper';
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
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAllTransactions', 'SELECT');
    }
  }

  private parseTagsSafely(tagsString: string | string[] | null): string[] | null {
    if (Array.isArray(tagsString)) {
      return tagsString;
    }
    if (typeof tagsString === 'string') {
      try {
        return JSON.parse(tagsString);
      } catch (error) {
        console.warn('Failed to parse tags JSON:', tagsString, error);
        return null;
      }
    }
    return null;
  }

  async getTransactionById(id: string, tenantId: string): Promise<LocalTransaction | null> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalTransaction | null;
      
      if (transaction && transaction.tags) {
        transaction.tags = this.parseTagsSafely(transaction.tags);
      }
      
      return transaction;
    } catch (error) {
      console.error('Error getting transaction by id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionById', 'SELECT');
    }
  }

  async createTransaction(transactionData: TransactionInsert): Promise<LocalTransaction> {
    try {
      // Validate required fields
      if (!transactionData.accountid) {
        throw new StorageError(
          'Account ID is required',
          StorageErrorCode.MISSING_REQUIRED_FIELD,
          { field: 'accountid', table: 'transactions' }
        );
      }

      if (!transactionData.categoryid) {
        throw new StorageError(
          'Category ID is required',
          StorageErrorCode.MISSING_REQUIRED_FIELD,
          { field: 'categoryid', table: 'transactions' }
        );
      }

      if (!transactionData.date) {
        throw new StorageError(
          'Transaction date is required',
          StorageErrorCode.MISSING_REQUIRED_FIELD,
          { field: 'date', table: 'transactions' }
        );
      }

      // Validate foreign key constraints explicitly
      const accountExists = await this.db.getFirstAsync(
        'SELECT id FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [transactionData.accountid, transactionData.tenantid || '']
      );
      
      if (!accountExists) {
        throw new ReferentialIntegrityError('accounts', 'id', transactionData.accountid);
      }

      const categoryExists = await this.db.getFirstAsync(
        'SELECT id FROM transactioncategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [transactionData.categoryid, transactionData.tenantid || '']
      );
      
      if (!categoryExists) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', transactionData.categoryid);
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
        type: transactionData.type || 'Expense',
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
      if (error instanceof ReferentialIntegrityError || error instanceof StorageError) {
        throw error;
      }
      throw SQLiteErrorMapper.mapError(error, 'createTransaction', 'INSERT');
    }
  }

  async updateTransaction(transactionData: TransactionUpdate): Promise<LocalTransaction> {
    try {
      if (!transactionData.id) {
        throw new StorageError(
          'Transaction ID is required for update',
          StorageErrorCode.MISSING_REQUIRED_FIELD,
          { field: 'id', table: 'transactions' }
        );
      }

      // Get current transaction to merge with updates
      const currentTransaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionData.id]
      ) as LocalTransaction;

      if (!currentTransaction) {
        throw new StorageError(
          'Transaction not found',
          StorageErrorCode.RECORD_NOT_FOUND,
          { recordId: transactionData.id, table: 'transactions' }
        );
      }

      // Validate foreign key constraints if they are being updated
      if (transactionData.accountid && transactionData.accountid !== currentTransaction.accountid) {
        const accountExists = await this.db.getFirstAsync(
          'SELECT id FROM accounts WHERE id = ? AND isdeleted = 0',
          [transactionData.accountid]
        );
        
        if (!accountExists) {
          throw new ReferentialIntegrityError('accounts', 'id', transactionData.accountid);
        }
      }

      if (transactionData.categoryid && transactionData.categoryid !== currentTransaction.categoryid) {
        const categoryExists = await this.db.getFirstAsync(
          'SELECT id FROM transactioncategories WHERE id = ? AND isdeleted = 0',
          [transactionData.categoryid]
        );
        
        if (!categoryExists) {
          throw new ReferentialIntegrityError('transactioncategories', 'id', transactionData.categoryid);
        }
      }

      // Parse current tags if they exist
      if (currentTransaction.tags) {
        currentTransaction.tags = this.parseTagsSafely(currentTransaction.tags);
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
      throw SQLiteErrorMapper.mapError(error, 'updateTransaction', 'UPDATE');
    }
  }

  async deleteTransaction(id: string, userId?: string): Promise<LocalTransaction> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      ) as LocalTransaction;

      if (!transaction) {
        throw new StorageError(
          'Transaction not found',
          StorageErrorCode.RECORD_NOT_FOUND,
          { recordId: id, table: 'transactions' }
        );
      }

      // Parse tags if they exist
      if (transaction.tags) {
        transaction.tags = this.parseTagsSafely(transaction.tags);
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
      throw SQLiteErrorMapper.mapError(error, 'deleteTransaction', 'UPDATE');
    }
  }

  async restoreTransaction(id: string, userId?: string): Promise<LocalTransaction> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      ) as LocalTransaction;

      if (!transaction) {
        throw new StorageError(
          'Transaction not found',
          StorageErrorCode.RECORD_NOT_FOUND,
          { recordId: id, table: 'transactions' }
        );
      }

      // Parse tags if they exist
      if (transaction.tags) {
        transaction.tags = this.parseTagsSafely(transaction.tags);
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
      throw SQLiteErrorMapper.mapError(error, 'restoreTransaction', 'UPDATE');
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
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by account:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionsByAccount', 'SELECT');
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
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionsByCategory', 'SELECT');
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
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionsByDateRange', 'SELECT');
    }
  }

  // Additional methods required by ITransactionProvider interface
  async getTransactions(searchFilters: any, tenantId: string): Promise<LocalTransaction[]> {
    try {
      let query = 'SELECT * FROM transactions WHERE tenantid = ? AND isdeleted = 0';
      const params: any[] = [tenantId];

      // Apply filters if provided
      if (searchFilters) {
        if (searchFilters.accountId) {
          query += ' AND accountid = ?';
          params.push(searchFilters.accountId);
        }
        if (searchFilters.categoryId) {
          query += ' AND categoryid = ?';
          params.push(searchFilters.categoryId);
        }
        if (searchFilters.startDate) {
          query += ' AND date >= ?';
          params.push(searchFilters.startDate);
        }
        if (searchFilters.endDate) {
          query += ' AND date <= ?';
          params.push(searchFilters.endDate);
        }
        if (searchFilters.type) {
          query += ' AND type = ?';
          params.push(searchFilters.type);
        }
        if (searchFilters.payee) {
          query += ' AND payee LIKE ?';
          params.push(`%${searchFilters.payee}%`);
        }
      }

      query += ' ORDER BY date DESC, createdat DESC';

      const transactions = await this.db.getAllAsync(query, params) as LocalTransaction[];
      
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting filtered transactions:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactions', 'SELECT');
    }
  }

  async getTransactionFullyById(transactionId: string, tenantId: string): Promise<LocalTransaction | null> {
    try {
      // For SQLite, this is the same as getTransactionById since we don't have joins
      return await this.getTransactionById(transactionId, tenantId);
    } catch (error) {
      console.error('Error getting transaction fully by id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionFullyById', 'SELECT');
    }
  }

  async getTransactionByTransferId(id: string, tenantId: string): Promise<LocalTransaction | null> {
    try {
      const transaction = await this.db.getFirstAsync(
        'SELECT * FROM transactions WHERE transferid = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as LocalTransaction | null;
      
      if (transaction && transaction.tags) {
        transaction.tags = this.parseTagsSafely(transaction.tags);
      }
      
      return transaction;
    } catch (error) {
      console.error('Error getting transaction by transfer id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionByTransferId', 'SELECT');
    }
  }

  async getTransactionsByName(text: string, tenantId: string): Promise<LocalTransaction[]> {
    try {
      const transactions = await this.db.getAllAsync(
        'SELECT * FROM transactions WHERE tenantid = ? AND isdeleted = 0 AND (name LIKE ? OR description LIKE ? OR payee LIKE ?) ORDER BY date DESC, createdat DESC',
        [tenantId, `%${text}%`, `%${text}%`, `%${text}%`]
      ) as LocalTransaction[];
      
      return transactions.map(t => ({
        ...t,
        tags: t.tags ? this.parseTagsSafely(t.tags) : null
      }));
    } catch (error) {
      console.error('Error getting transactions by name:', error);
      throw SQLiteErrorMapper.mapError(error, 'getTransactionsByName', 'SELECT');
    }
  }

  async createTransactions(transactions: TransactionInsert[]): Promise<LocalTransaction[]> {
    const results: LocalTransaction[] = [];
    
    for (const transactionData of transactions) {
      try {
        const result = await this.createTransaction(transactionData);
        results.push(result);
      } catch (error) {
        console.error('Error creating transaction in batch:', error);
        // Continue with other transactions but log the error
        throw error; // Or handle differently based on requirements
      }
    }
    
    return results;
  }

  async createMultipleTransactions(transactions: TransactionInsert[]): Promise<LocalTransaction[]> {
    // Alias for createTransactions for interface compatibility
    return await this.createTransactions(transactions);
  }

  async updateTransferTransaction(transactionData: TransactionUpdate): Promise<LocalTransaction> {
    try {
      // For transfer transactions, we need to update both the source and target transactions
      const updatedTransaction = await this.updateTransaction(transactionData);
      
      // If this transaction has a transfer ID, update the linked transaction as well
      if (updatedTransaction.transferid) {
        const linkedTransaction = await this.getTransactionById(updatedTransaction.transferid, updatedTransaction.tenantid);
        if (linkedTransaction) {
          // Update the linked transaction with corresponding changes
          await this.updateTransaction({
            id: linkedTransaction.id,
            amount: -updatedTransaction.amount, // Opposite amount for transfer
            date: updatedTransaction.date,
            description: updatedTransaction.description,
            notes: updatedTransaction.notes,
            updatedat: new Date().toISOString(),
            updatedby: updatedTransaction.updatedby
          });
        }
      }
      
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transfer transaction:', error);
      throw SQLiteErrorMapper.mapError(error, 'updateTransferTransaction', 'UPDATE');
    }
  }
}

export const sqliteTransactionProvider = new SQLiteTransactionProvider();