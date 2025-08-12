import { IStatsProvider, StorageError } from '../../storage/types';
import { sqliteDb } from './BudgeteerSQLiteDatabase';

export class SQLiteStatsProvider implements IStatsProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getStats(tenantId: string): Promise<any> {
    try {
      // Get basic statistics for the tenant
      const totalAccounts = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM accounts WHERE tenantid = ? AND isdeleted = 0',
        [tenantId]
      ) as { count: number };

      const totalTransactions = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM transactions WHERE tenantid = ? AND isdeleted = 0',
        [tenantId]
      ) as { count: number };

      const totalBalance = await this.db.getFirstAsync(
        'SELECT SUM(balance) as total FROM accounts WHERE tenantid = ? AND isdeleted = 0',
        [tenantId]
      ) as { total: number };

      const monthlyExpenses = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE tenantid = ? AND isdeleted = 0 AND type = 'expense' 
         AND date >= date('now', 'start of month')`,
        [tenantId]
      ) as { total: number };

      const monthlyIncome = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE tenantid = ? AND isdeleted = 0 AND type = 'income' 
         AND date >= date('now', 'start of month')`,
        [tenantId]
      ) as { total: number };

      return {
        totalAccounts: totalAccounts?.count || 0,
        totalTransactions: totalTransactions?.count || 0,
        totalBalance: totalBalance?.total || 0,
        monthlyExpenses: monthlyExpenses?.total || 0,
        monthlyIncome: monthlyIncome?.total || 0,
        netIncome: (monthlyIncome?.total || 0) - (monthlyExpenses?.total || 0)
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new StorageError('Failed to get stats', 'GET_STATS_ERROR', error);
    }
  }

  async getAccountStats(accountId: string, tenantId: string): Promise<any> {
    try {
      // Get account-specific statistics
      const account = await this.db.getFirstAsync(
        'SELECT * FROM accounts WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [accountId, tenantId]
      );

      if (!account) {
        throw new StorageError('Account not found', 'ACCOUNT_NOT_FOUND');
      }

      const transactionCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM transactions WHERE accountid = ? AND tenantid = ? AND isdeleted = 0',
        [accountId, tenantId]
      ) as { count: number };

      const totalExpenses = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 AND type = 'expense'`,
        [accountId, tenantId]
      ) as { total: number };

      const totalIncome = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 AND type = 'income'`,
        [accountId, tenantId]
      ) as { total: number };

      const monthlyExpenses = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 AND type = 'expense' 
         AND date >= date('now', 'start of month')`,
        [accountId, tenantId]
      ) as { total: number };

      const monthlyIncome = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE accountid = ? AND tenantid = ? AND isdeleted = 0 AND type = 'income' 
         AND date >= date('now', 'start of month')`,
        [accountId, tenantId]
      ) as { total: number };

      return {
        account,
        transactionCount: transactionCount?.count || 0,
        totalExpenses: totalExpenses?.total || 0,
        totalIncome: totalIncome?.total || 0,
        monthlyExpenses: monthlyExpenses?.total || 0,
        monthlyIncome: monthlyIncome?.total || 0,
        netIncome: (totalIncome?.total || 0) - (totalExpenses?.total || 0),
        monthlyNetIncome: (monthlyIncome?.total || 0) - (monthlyExpenses?.total || 0)
      };
    } catch (error) {
      console.error('Error getting account stats:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to get account stats', 'GET_ACCOUNT_STATS_ERROR', error);
    }
  }

  async getCategoryStats(categoryId: string, tenantId: string): Promise<any> {
    try {
      // Get category-specific statistics
      const category = await this.db.getFirstAsync(
        'SELECT * FROM transactioncategories WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [categoryId, tenantId]
      );

      if (!category) {
        throw new StorageError('Category not found', 'CATEGORY_NOT_FOUND');
      }

      const transactionCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM transactions WHERE categoryid = ? AND tenantid = ? AND isdeleted = 0',
        [categoryId, tenantId]
      ) as { count: number };

      const totalAmount = await this.db.getFirstAsync(
        'SELECT SUM(amount) as total FROM transactions WHERE categoryid = ? AND tenantid = ? AND isdeleted = 0',
        [categoryId, tenantId]
      ) as { total: number };

      const monthlyAmount = await this.db.getFirstAsync(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE categoryid = ? AND tenantid = ? AND isdeleted = 0 
         AND date >= date('now', 'start of month')`,
        [categoryId, tenantId]
      ) as { total: number };

      const averageTransaction = await this.db.getFirstAsync(
        'SELECT AVG(amount) as average FROM transactions WHERE categoryid = ? AND tenantid = ? AND isdeleted = 0',
        [categoryId, tenantId]
      ) as { average: number };

      return {
        category,
        transactionCount: transactionCount?.count || 0,
        totalAmount: totalAmount?.total || 0,
        monthlyAmount: monthlyAmount?.total || 0,
        averageTransaction: averageTransaction?.average || 0,
        budgetAmount: (category as any)?.budgetamount || 0,
        budgetUtilization: ((monthlyAmount?.total || 0) / ((category as any)?.budgetamount || 1)) * 100
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to get category stats', 'GET_CATEGORY_STATS_ERROR', error);
    }
  }
}

export const sqliteStatsProvider = new SQLiteStatsProvider();