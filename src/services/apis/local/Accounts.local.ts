import { db, LocalAccount } from './BudgeteerDatabase';
import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError, 
  RecordNotFoundError,
  withStorageErrorHandling 
} from '../../storage/errors/StorageErrors';
import { Account, Inserts, Updates } from '../../../types/db/Tables.Types';
import { TableNames } from '../../../types/db/TableNames';
import { IAccountProvider } from '../../../types/storage/providers/IAccountProvider';
import { StorageMode } from '../../../types/storage/StorageTypes';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

// Extended Account type with category information
type AccountWithCategory = Account & { 
  category?: {
    displayorder: number;
    [key: string]: any;
  } | null;
};

export class LocalAccountProvider implements IAccountProvider {
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

  async getAllAccounts(tenantId: string): Promise<Account[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            // Use optimized query for performance
            const accounts = await db.accounts
              .where('tenantid')
              .equals(tenantId)
              .and(account => !account.isdeleted)
              .toArray();

            // Fetch categories for each account using optimized queries
            const accountsWithCategories: AccountWithCategory[] = await Promise.all(
              accounts.map(async (account) => {
                const category = await db.accountcategories
                  .where('id')
                  .equals(account.categoryid)
                  .first();
                
                return {
                  ...account,
                  category
                } as AccountWithCategory;
              })
            );

            // Sort by category display order, then account display order, then name, then owner
            const sortedAccounts = accountsWithCategories.sort((a, b) => {
              if (a.category?.displayorder !== b.category?.displayorder) {
                return (b.category?.displayorder || 0) - (a.category?.displayorder || 0);
              }
              if (a.displayorder !== b.displayorder) {
                return b.displayorder - a.displayorder;
              }
              if (a.name !== b.name) {
                return a.name.localeCompare(b.name);
              }
              return (a.owner || '').localeCompare(b.owner || '');
            });

            // Return as Account[] (removing the category property for the return type)
            return sortedAccounts.map(({ category, ...account }) => account as Account);
          },
          'getAllAccounts',
          'accounts',
          { tenantId }
        );
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
        return await db.safeQuery(
          async () => {
            const account = await db.accounts
              .where('id')
              .equals(id)
              .and(account => account.tenantid === tenantId && !account.isdeleted)
              .first();

            if (!account) return null;

            // Fetch category
            const category = await db.accountcategories
              .where('id')
              .equals(account.categoryid)
              .first();

            if (!category) {
              throw new ReferentialIntegrityError('accountcategories', 'id', account.categoryid, {
                operation: 'getAccountById',
                table: 'accounts',
                recordId: id
              });
            }

            return {
              ...account,
              category
            } as Account;
          },
          'getAccountById',
          'accounts',
          { id, tenantId }
        );
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

  async createAccount(account: Inserts<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const newAccount: LocalAccount = {
              id: account.id || uuidv4(),
              tenantid: account.tenantid || '',
              name: account.name,
              balance: account.balance || 0,
              categoryid: account.categoryid,
              color: account.color || '#000000',
              currency: account.currency || 'USD',
              description: account.description || null,
              displayorder: account.displayorder || 0,
              icon: account.icon || 'wallet',
              isdeleted: account.isdeleted || false,
              notes: account.notes || null,
              owner: account.owner || null,
              createdat: account.createdat || new Date().toISOString(),
              createdby: account.createdby || null,
              updatedat: account.updatedat || new Date().toISOString(),
              updatedby: account.updatedby || null
            };

            // The referential integrity validation is handled by the Dexie hook
            await db.accounts.add(newAccount);
            return newAccount;
          },
          'createAccount',
          'accounts',
          { accountData: account }
        );
      },
      {
        storageMode: 'local',
        operation: 'createAccount',
        table: 'accounts',
        tenantId: account.tenantid
      }
    );
  }

  async updateAccount(account: Updates<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            if (!account.id) {
              throw new StorageError(
                'Account ID is required for update',
                StorageErrorCode.INVALID_DATA,
                { operation: 'updateAccount', table: 'accounts' }
              );
            }

            const updateData = {
              ...account,
              updatedat: new Date().toISOString()
            };

            // The referential integrity validation is handled by the Dexie hook
            const updateCount = await db.accounts.update(account.id, updateData);
            
            if (updateCount === 0) {
              throw new RecordNotFoundError('accounts', account.id, {
                operation: 'updateAccount'
              });
            }
            
            const updatedAccount = await db.accounts.get(account.id);
            return updatedAccount;
          },
          'updateAccount',
          'accounts',
          { accountId: account.id }
        );
      },
      {
        storageMode: 'local',
        operation: 'updateAccount',
        table: 'accounts',
        recordId: account.id,
        tenantId: account.tenantid
      }
    );
  }

  async deleteAccount(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const updateData = {
              isdeleted: true,
              updatedby: userId || null,
              updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
            };

            const updateCount = await db.accounts.update(id, updateData);
            
            if (updateCount === 0) {
              throw new RecordNotFoundError('accounts', id, {
                operation: 'deleteAccount'
              });
            }

            // Handle cascade delete for related records
            await db.cascadeDelete('accounts', id, '');
            
            const deletedAccount = await db.accounts.get(id);
            return deletedAccount;
          },
          'deleteAccount',
          'accounts',
          { accountId: id, userId }
        );
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
        return await db.safeQuery(
          async () => {
            const updateData = {
              isdeleted: false,
              updatedby: userId || null,
              updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
            };

            const updateCount = await db.accounts.update(id, updateData);
            
            if (updateCount === 0) {
              throw new RecordNotFoundError('accounts', id, {
                operation: 'restoreAccount'
              });
            }
            
            const restoredAccount = await db.accounts.get(id);
            return restoredAccount;
          },
          'restoreAccount',
          'accounts',
          { accountId: id, userId }
        );
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
        return await db.safeQuery(
          async () => {
            const account = await db.accounts.get(accountid);
            if (!account) {
              throw new RecordNotFoundError('accounts', accountid, {
                operation: 'updateAccountBalance'
              });
            }

            const newBalance = account.balance + amount;
            const updateCount = await db.accounts.update(accountid, { 
              balance: newBalance,
              updatedat: new Date().toISOString()
            });

            if (updateCount === 0) {
              throw new StorageError(
                'Failed to update account balance',
                StorageErrorCode.UPDATE_OPERATION_FAILED,
                { accountid, amount, operation: 'updateAccountBalance' }
              );
            }

            return { success: true, new_balance: newBalance };
          },
          'updateAccountBalance',
          'accounts',
          { accountid, amount }
        );
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
        return await db.safeQuery(
          async () => {
            // Use optimized query for better performance
            const transaction = await db.transactions
              .where('accountid')
              .equals(accountid)
              .and(transaction => 
                transaction.tenantid === tenantId && 
                transaction.type === 'Initial' &&
                !transaction.isdeleted
              )
              .first();

            if (!transaction) {
              throw new RecordNotFoundError('transactions', `Initial transaction for account ${accountid}`, {
                operation: 'getAccountOpenedTransaction',
                accountid,
                tenantId
              });
            }

            return {
              id: transaction.id,
              amount: transaction.amount
            };
          },
          'getAccountOpenedTransaction',
          'transactions',
          { accountid, tenantId }
        );
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
        return await db.safeQuery(
          async () => {
            // Use optimized query for optimal performance
            const accounts = await db.accounts
              .where('tenantid')
              .equals(tenantId)
              .and(account => !account.isdeleted)
              .toArray();

            const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

            return { totalbalance: totalBalance };
          },
          'getTotalAccountBalance',
          'accounts',
          { tenantId }
        );
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

// Export provider instance
export const localAccountProvider = new LocalAccountProvider();