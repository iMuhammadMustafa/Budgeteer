import { db, LocalAccount } from './BudgeteerDatabase';
import { ReferentialIntegrityError } from '../../storage/types';
import { Account, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  try {
    const accounts = await db.accounts
      .where('tenantid')
      .equals(tenantId)
      .and(account => !account.isdeleted)
      .toArray();

    // Fetch categories for each account
    const accountsWithCategories = await Promise.all(
      accounts.map(async (account) => {
        const category = await db.accountcategories
          .where('id')
          .equals(account.categoryid)
          .first();
        
        return {
          ...account,
          category
        } as Account;
      })
    );

    // Sort by category display order, then account display order, then name, then owner
    return accountsWithCategories.sort((a, b) => {
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
  } catch (error) {
    throw new Error(`Failed to get accounts: ${error}`);
  }
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  try {
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
      throw new ReferentialIntegrityError('accountcategories', 'id', account.categoryid);
    }

    return {
      ...account,
      category
    } as Account;
  } catch (error) {
    throw new Error(`Failed to get account by id: ${error}`);
  }
};

export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  try {
    // Validate foreign key constraint
    if (account.categoryid) {
      const categoryExists = await db.accountcategories
        .where('id')
        .equals(account.categoryid)
        .count();
      
      if (categoryExists === 0) {
        throw new ReferentialIntegrityError('accountcategories', 'id', account.categoryid);
      }
    }

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

    await db.accounts.add(newAccount);
    return newAccount;
  } catch (error) {
    throw new Error(`Failed to create account: ${error}`);
  }
};

export const updateAccount = async (account: Updates<TableNames.Accounts>) => {
  try {
    if (!account.id) {
      throw new Error('Account ID is required for update');
    }

    // Validate foreign key constraint if categoryid is being updated
    if (account.categoryid) {
      const categoryExists = await db.accountcategories
        .where('id')
        .equals(account.categoryid)
        .count();
      
      if (categoryExists === 0) {
        throw new ReferentialIntegrityError('accountcategories', 'id', account.categoryid);
      }
    }

    const updateData = {
      ...account,
      updatedat: new Date().toISOString()
    };

    await db.accounts.update(account.id, updateData);
    
    const updatedAccount = await db.accounts.get(account.id);
    return updatedAccount;
  } catch (error) {
    throw new Error(`Failed to update account: ${error}`);
  }
};

export const deleteAccount = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.accounts.update(id, updateData);
    
    const deletedAccount = await db.accounts.get(id);
    return deletedAccount;
  } catch (error) {
    throw new Error(`Failed to delete account: ${error}`);
  }
};

export const restoreAccount = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.accounts.update(id, updateData);
    
    const restoredAccount = await db.accounts.get(id);
    return restoredAccount;
  } catch (error) {
    throw new Error(`Failed to restore account: ${error}`);
  }
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
  try {
    const account = await db.accounts.get(accountid);
    if (!account) {
      throw new Error(`Account with id ${accountid} not found`);
    }

    const newBalance = account.balance + amount;
    await db.accounts.update(accountid, { 
      balance: newBalance,
      updatedat: new Date().toISOString()
    });

    return { success: true, new_balance: newBalance };
  } catch (error) {
    throw new Error(`Failed to update account balance: ${error}`);
  }
};

export const getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
  try {
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
      throw new Error('Initial transaction not found');
    }

    return {
      id: transaction.id,
      amount: transaction.amount
    };
  } catch (error) {
    throw new Error(`Failed to get account opened transaction: ${error}`);
  }
};

export const getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
  try {
    const accounts = await db.accounts
      .where('tenantid')
      .equals(tenantId)
      .and(account => !account.isdeleted)
      .toArray();

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    return { totalbalance: totalBalance };
  } catch (error) {
    throw new Error(`Failed to get total account balance: ${error}`);
  }
};