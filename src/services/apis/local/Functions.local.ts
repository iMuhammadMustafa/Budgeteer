import { db } from './BudgeteerDatabase';
import { withStorageErrorHandling } from '../../storage/errors';
import { StorageError, StorageErrorCode, RecordNotFoundError } from '../../storage/errors/StorageErrors';

/**
 * Local implementation of Supabase functions for IndexedDB
 */
export class LocalFunctionsService {
  
  /**
   * UpdateAccountBalance function equivalent
   * Updates account balance by adding the specified amount and returns the new balance
   */
  async updateAccountBalance(accountId: string, amount: number): Promise<number> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            return await db.transaction('rw', db.accounts, async () => {
              // Get the current account
              const account = await db.accounts.get(accountId);
              
              if (!account) {
                throw new RecordNotFoundError('accounts', accountId, {
                  operation: 'updateAccountBalance'
                });
              }

              if (account.isdeleted) {
                throw new StorageError(
                  'Cannot update balance for deleted account',
                  StorageErrorCode.RECORD_NOT_FOUND,
                  { accountId, operation: 'updateAccountBalance' }
                );
              }

              // Calculate new balance
              const currentBalance = account.balance || 0;
              const newBalance = currentBalance + amount;

              // Update the account
              await db.accounts.update(accountId, {
                balance: newBalance,
                updatedat: new Date().toISOString()
              });

              return newBalance;
            });
          },
          'updateAccountBalance',
          'accounts',
          { accountId, amount }
        );
      },
      {
        storageMode: 'local',
        operation: 'updateAccountBalance',
        table: 'accounts',
        recordId: accountId
      }
    );
  }

  /**
   * Get monthly net worth function equivalent
   * Returns monthly net worth data for the specified date range
   */
  async getMonthlyNetWorth(startDate: string, endDate: string, tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where('tenantid')
              .equals(tenantId)
              .and(t => 
                !t.isdeleted && 
                !t.isvoid &&
                (t.date || '') >= startDate && 
                (t.date || '') <= endDate
              )
              .toArray();

            // Group by month and calculate net worth
            const monthlyData = new Map<string, { month_label: string; balance: number }>();

            // Get unique months in range
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            const currentDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
            
            while (currentDate <= endDateObj) {
              const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
              const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              
              monthlyData.set(monthKey, {
                month_label: monthLabel,
                balance: 0
              });
              
              currentDate.setMonth(currentDate.getMonth() + 1);
            }

            // Calculate balance for each month
            for (const [monthKey, monthData] of monthlyData) {
              const monthEndDate = new Date(`${monthKey}-01`);
              monthEndDate.setMonth(monthEndDate.getMonth() + 1);
              monthEndDate.setDate(0); // Last day of month

              // Get all transactions up to this month end
              const relevantTransactions = transactions.filter(t => 
                new Date(t.date || '') <= monthEndDate
              );

              // Calculate net worth (sum of all account balances at end of month)
              const accountBalances = new Map<string, number>();
              
              relevantTransactions
                .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
                .forEach(t => {
                  const currentBalance = accountBalances.get(t.accountid) || 0;
                  accountBalances.set(t.accountid, currentBalance + (t.amount || 0));
                });

              const totalBalance = Array.from(accountBalances.values()).reduce((sum, balance) => sum + balance, 0);
              monthData.balance = totalBalance;
            }

            return Array.from(monthlyData.values());
          },
          'getMonthlyNetWorth',
          'stats',
          { startDate, endDate, tenantId }
        );
      },
      {
        storageMode: 'local',
        operation: 'getMonthlyNetWorth',
        table: 'stats',
        tenantId
      }
    );
  }

  /**
   * Apply recurring transaction function equivalent
   * Creates a new transaction based on a recurring transaction template
   */
  async applyRecurringTransaction(recurringId: string, tenantId: string): Promise<string> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            return await db.transaction('rw', db.recurrings, db.transactions, async () => {
              // Get the recurring transaction
              const recurring = await db.recurrings.get(recurringId);
              
              if (!recurring) {
                throw new RecordNotFoundError('recurrings', recurringId, {
                  operation: 'applyRecurringTransaction'
                });
              }

              if (recurring.isdeleted || !recurring.isactive || recurring.tenantid !== tenantId) {
                throw new StorageError(
                  'Recurring transaction is not active or accessible',
                  StorageErrorCode.INVALID_DATA,
                  { recurringId, tenantId, operation: 'applyRecurringTransaction' }
                );
              }

              // Create new transaction based on recurring template
              const newTransactionId = crypto.randomUUID();
              const currentDate = new Date().toISOString();

              const newTransaction = {
                id: newTransactionId,
                tenantid: recurring.tenantid,
                accountid: recurring.sourceaccountid,
                categoryid: recurring.categoryid || '',
                date: currentDate,
                amount: recurring.amount || 0,
                type: recurring.type || 'Expense',
                name: recurring.name,
                description: recurring.description || null,
                payee: recurring.payeename || null,
                notes: recurring.notes || null,
                transferaccountid: null,
                transferid: null,
                isdeleted: false,
                isvoid: false,
                tags: null,
                createdat: currentDate,
                createdby: null,
                updatedat: currentDate,
                updatedby: null
              };

              // Add the transaction
              await db.transactions.add(newTransaction);

              // Update recurring transaction's last executed date
              await db.recurrings.update(recurringId, {
                lastexecutedat: currentDate,
                updatedat: currentDate
              });

              return newTransactionId;
            });
          },
          'applyRecurringTransaction',
          'recurrings',
          { recurringId, tenantId }
        );
      },
      {
        storageMode: 'local',
        operation: 'applyRecurringTransaction',
        table: 'recurrings',
        recordId: recurringId,
        tenantId
      }
    );
  }

  /**
   * Update running balances for all transactions in an account
   * This simulates the trigger functionality for maintaining running balances
   */
  async recalculateRunningBalances(accountId: string, tenantId: string): Promise<void> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            return await db.transaction('rw', db.transactions, async () => {
              // Get all transactions for this account
              const transactions = await db.transactions
                .where('accountid')
                .equals(accountId)
                .and(t => t.tenantid === tenantId && !t.isdeleted)
                .toArray();

              // Sort by date, createdat, updatedat, type, id (same as SQL view)
              transactions.sort((a, b) => {
                const dateA = new Date(a.date || '');
                const dateB = new Date(b.date || '');
                const dateCompare = dateA.getTime() - dateB.getTime();
                if (dateCompare !== 0) return dateCompare;

                const createDateA = new Date(a.createdat || '');
                const createDateB = new Date(b.createdat || '');
                const createDateCompare = createDateA.getTime() - createDateB.getTime();
                if (createDateCompare !== 0) return createDateCompare;

                const updateDateA = new Date(a.updatedat || '');
                const updateDateB = new Date(b.updatedat || '');
                const updateDateCompare = updateDateA.getTime() - updateDateB.getTime();
                if (updateDateCompare !== 0) return updateDateCompare;

                const typeCompare = (a.type || '').localeCompare(b.type || '');
                if (typeCompare !== 0) return typeCompare;

                return (a.id || '').localeCompare(b.id || '');
              });

              // Calculate and update running balances
              let runningBalance = 0;
              
              for (const transaction of transactions) {
                if (!transaction.isvoid) {
                  runningBalance += transaction.amount || 0;
                }
                
                // Store running balance in a custom field (Note: this is for reference only)
                // The actual running balance calculation is done in the view service
                // This function primarily exists for compatibility with the Supabase function
              }

              // Update account balance to reflect the final running balance
              await db.accounts.update(accountId, {
                balance: runningBalance,
                updatedat: new Date().toISOString()
              });
            });
          },
          'recalculateRunningBalances',
          'transactions',
          { accountId, tenantId }
        );
      },
      {
        storageMode: 'local',
        operation: 'recalculateRunningBalances',
        table: 'transactions',
        tenantId
      }
    );
  }
}

// Export singleton instance
export const localFunctionsService = new LocalFunctionsService();
