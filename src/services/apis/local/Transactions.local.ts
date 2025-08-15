import { db, LocalTransaction } from './BudgeteerDatabase';
import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError, 
  RecordNotFoundError 
} from '../../storage/errors/StorageErrors';
import { Transaction, Inserts, Updates } from '../../../types/db/Tables.Types';
import { TableNames } from '../../../types/db/TableNames';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllTransactions = async (tenantId: string): Promise<Transaction[]> => {
  return await db.safeQuery(
    async () => {
      // Use optimized query for optimal performance
      const transactions = await db.transactions
        .where('tenantid')
        .equals(tenantId)
        .and(transaction => !transaction.isdeleted)
        .reverse()
        .sortBy('date');

      return transactions as Transaction[];
    },
    'getAllTransactions',
    'transactions',
    { tenantId }
  );
};

export const getTransactionById = async (id: string, tenantId: string): Promise<Transaction | null> => {
  return await db.safeQuery(
    async () => {
      const transaction = await db.transactions
        .where('id')
        .equals(id)
        .and(transaction => transaction.tenantid === tenantId && !transaction.isdeleted)
        .first();

      return transaction as Transaction || null;
    },
    'getTransactionById',
    'transactions',
    { id, tenantId }
  );
};

export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  return await db.safeQuery(
    async () => {
      const newTransaction: LocalTransaction = {
        id: transaction.id || uuidv4(),
        tenantid: transaction.tenantid || '',
        accountid: transaction.accountid,
        categoryid: transaction.categoryid,
        date: transaction.date,
        amount: transaction.amount || 0,
        type: transaction.type || 'Expense',
        description: transaction.description || null,
        name: transaction.name || null,
        notes: transaction.notes || null,
        payee: transaction.payee || null,
        tags: transaction.tags || null,
        transferaccountid: transaction.transferaccountid || null,
        transferid: transaction.transferid || null,
        isdeleted: transaction.isdeleted || false,
        isvoid: transaction.isvoid || false,
        createdat: transaction.createdat || new Date().toISOString(),
        createdby: transaction.createdby || null,
        updatedat: transaction.updatedat || new Date().toISOString(),
        updatedby: transaction.updatedby || null
      };

      // The referential integrity validation is handled by the Dexie hook
      await db.transactions.add(newTransaction);
      return newTransaction;
    },
    'createTransaction',
    'transactions',
    { transactionData: transaction }
  );
};

export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  try {
    if (!transaction.id) {
      throw new Error('Transaction ID is required for update');
    }

    // Validate foreign key constraints if they are being updated
    if (transaction.accountid) {
      const accountExists = await db.accounts
        .where('id')
        .equals(transaction.accountid)
        .count();
      
      if (accountExists === 0) {
        throw new ReferentialIntegrityError('accounts', 'id', transaction.accountid);
      }
    }

    if (transaction.categoryid) {
      const categoryExists = await db.transactioncategories
        .where('id')
        .equals(transaction.categoryid)
        .count();
      
      if (categoryExists === 0) {
        throw new ReferentialIntegrityError('transactioncategories', 'id', transaction.categoryid);
      }
    }

    if (transaction.transferaccountid) {
      const transferAccountExists = await db.accounts
        .where('id')
        .equals(transaction.transferaccountid)
        .count();
      
      if (transferAccountExists === 0) {
        throw new ReferentialIntegrityError('accounts', 'id', transaction.transferaccountid);
      }
    }

    const updateData = {
      ...transaction,
      updatedat: new Date().toISOString()
    };

    await db.transactions.update(transaction.id, updateData);
    
    const updatedTransaction = await db.transactions.get(transaction.id);
    return updatedTransaction;
  } catch (error) {
    throw new Error(`Failed to update transaction: ${error}`);
  }
};

export const deleteTransaction = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactions.update(id, updateData);
    
    const deletedTransaction = await db.transactions.get(id);
    return deletedTransaction;
  } catch (error) {
    throw new Error(`Failed to delete transaction: ${error}`);
  }
};

export const restoreTransaction = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.transactions.update(id, updateData);
    
    const restoredTransaction = await db.transactions.get(id);
    return restoredTransaction;
  } catch (error) {
    throw new Error(`Failed to restore transaction: ${error}`);
  }
};

export const getTransactionsByAccount = async (accountId: string, tenantId: string): Promise<Transaction[]> => {
  return await db.safeQuery(
    async () => {
      const transactions = await db.transactions
        .where('accountid')
        .equals(accountId)
        .and(transaction => transaction.tenantid === tenantId && !transaction.isdeleted)
        .reverse()
        .sortBy('date');

      return transactions as Transaction[];
    },
    'getTransactionsByAccount',
    'transactions',
    { accountId, tenantId }
  );
};

export const getTransactionsByCategory = async (categoryId: string, tenantId: string): Promise<Transaction[]> => {
  return await db.safeQuery(
    async () => {
      const transactions = await db.transactions
        .where('categoryid')
        .equals(categoryId)
        .and(transaction => transaction.tenantid === tenantId && !transaction.isdeleted)
        .reverse()
        .sortBy('date');

      return transactions as Transaction[];
    },
    'getTransactionsByCategory',
    'transactions',
    { categoryId, tenantId }
  );
};

export const getTransactionsByDateRange = async (startDate: string, endDate: string, tenantId: string): Promise<Transaction[]> => {
  return await db.safeQuery(
    async () => {
      const transactions = await db.transactions
        .where('tenantid')
        .equals(tenantId)
        .and(transaction => 
          !transaction.isdeleted && 
          transaction.date >= startDate && 
          transaction.date <= endDate
        )
        .reverse()
        .sortBy('date');

      return transactions as Transaction[];
    },
    'getTransactionsByDateRange',
    'transactions',
    { startDate, endDate, tenantId }
  );
};