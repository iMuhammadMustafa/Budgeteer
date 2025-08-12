import { db } from './BudgeteerDatabase';
// Stats local storage provider

export const getStats = async (tenantId: string) => {
  try {
    // Get basic statistics from local storage
    const accounts = await db.accounts
      .where('tenantid')
      .equals(tenantId)
      .and(account => !account.isdeleted)
      .toArray();

    const transactions = await db.transactions
      .where('tenantid')
      .equals(tenantId)
      .and(transaction => !transaction.isdeleted)
      .toArray();

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const totalTransactions = transactions.length;
    
    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBalance,
      totalTransactions,
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses
    };
  } catch (error) {
    throw new Error(`Failed to get stats: ${error}`);
  }
};

export const getAccountStats = async (accountId: string, tenantId: string) => {
  try {
    const account = await db.accounts
      .where('id')
      .equals(accountId)
      .and(account => account.tenantid === tenantId && !account.isdeleted)
      .first();

    if (!account) {
      throw new Error(`Account with id ${accountId} not found`);
    }

    const transactions = await db.transactions
      .where('accountid')
      .equals(accountId)
      .and(transaction => transaction.tenantid === tenantId && !transaction.isdeleted)
      .toArray();

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      accountId,
      accountName: account.name,
      balance: account.balance,
      totalTransactions,
      totalAmount,
      totalIncome: income,
      totalExpenses: expenses
    };
  } catch (error) {
    throw new Error(`Failed to get account stats: ${error}`);
  }
};

export const getCategoryStats = async (categoryId: string, tenantId: string) => {
  try {
    const category = await db.transactioncategories
      .where('id')
      .equals(categoryId)
      .and(category => category.tenantid === tenantId && !category.isdeleted)
      .first();

    if (!category) {
      throw new Error(`Category with id ${categoryId} not found`);
    }

    const transactions = await db.transactions
      .where('categoryid')
      .equals(categoryId)
      .and(transaction => transaction.tenantid === tenantId && !transaction.isdeleted)
      .toArray();

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      categoryId,
      categoryName: category.name,
      totalTransactions,
      totalAmount,
      totalIncome: income,
      totalExpenses: expenses,
      budgetAmount: category.budgetamount,
      budgetFrequency: category.budgetfrequency
    };
  } catch (error) {
    throw new Error(`Failed to get category stats: ${error}`);
  }
};