// Mock implementation for Transactions API

import { Transaction, TransactionsView, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { 
  transactions, 
  accounts, 
  transactionCategories, 
  transactionGroups,
  validateReferentialIntegrity 
} from "./mockDataStore";

const toTransactionsView = (tr: Transaction): TransactionsView => {
  const account = accounts.find(acc => acc.id === tr.accountid) ?? null;
  const category = transactionCategories.find(cat => cat.id === tr.categoryid) ?? null;
  const group = category && category.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;
  
  return {
    accountid: tr.accountid,
    accountname: account?.name ?? null,
    amount: tr.amount,
    balance: account?.balance ?? null,
    categoryid: tr.categoryid,
    categoryname: category?.name ?? null,
    createdat: tr.createdat,
    currency: account?.currency ?? null,
    date: tr.date,
    description: tr.description,
    groupicon: group?.icon ?? null,
    groupid: group?.id ?? null,
    groupname: group?.name ?? null,
    icon: category?.icon ?? null,
    id: tr.id,
    isdeleted: tr.isdeleted,
    isvoid: tr.isvoid,
    name: tr.name,
    notes: tr.notes,
    payee: tr.payee,
    runningbalance: null, // Would be calculated in real implementation
    tags: tr.tags,
    tenantid: tr.tenantid,
    transferaccountid: tr.transferaccountid,
    transferid: tr.transferid,
    type: tr.type,
    updatedat: tr.updatedat,
  };
};

export const getAllTransactions = async (tenantId: string) => {
  return transactions
    .filter(tr => (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted)
    .map(toTransactionsView);
};

export const getTransactions = async (searchFilters: TransactionFilters, tenantId: string) => {
  let filtered = transactions.filter(tr => 
    (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted
  );

  // Apply filters
  if (searchFilters.startDate) {
    filtered = filtered.filter(tr => tr.date >= searchFilters.startDate!);
  }
  if (searchFilters.endDate) {
    filtered = filtered.filter(tr => tr.date <= searchFilters.endDate!);
  }
  if (searchFilters.name) {
    filtered = filtered.filter(tr => 
      tr.name?.toLowerCase().includes(searchFilters.name!.toLowerCase())
    );
  }
  if (searchFilters.description) {
    filtered = filtered.filter(tr => 
      tr.description?.toLowerCase().includes(searchFilters.description!.toLowerCase())
    );
  }
  if (searchFilters.amount !== undefined) {
    filtered = filtered.filter(tr => tr.amount === searchFilters.amount);
  }
  if (searchFilters.categoryid) {
    filtered = filtered.filter(tr => tr.categoryid === searchFilters.categoryid);
  }
  if (searchFilters.accountid) {
    filtered = filtered.filter(tr => tr.accountid === searchFilters.accountid);
  }
  if (searchFilters.isVoid !== undefined) {
    filtered = filtered.filter(tr => tr.isvoid === searchFilters.isVoid);
  }
  if (searchFilters.type) {
    filtered = filtered.filter(tr => tr.type === searchFilters.type);
  }
  if (searchFilters.tags && searchFilters.tags.length > 0) {
    filtered = filtered.filter(tr => 
      tr.tags && tr.tags.some(tag => searchFilters.tags!.includes(tag))
    );
  }

  // Apply pagination
  if (searchFilters.startIndex !== undefined && searchFilters.endIndex !== undefined) {
    filtered = filtered.slice(searchFilters.startIndex, searchFilters.endIndex + 1);
  }

  return filtered.map(toTransactionsView);
};

export const getTransactionFullyById = async (transactionid: string, tenantId: string) => {
  const transaction = transactions.find(tr => 
    tr.id === transactionid && 
    (tr.tenantid === tenantId || tenantId === "demo") && 
    !tr.isdeleted
  );
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return toTransactionsView(transaction);
};

export const getTransactionById = async (transactionid: string, tenantId: string) => {
  const transaction = transactions.find(tr => 
    tr.id === transactionid && 
    (tr.tenantid === tenantId || tenantId === "demo") && 
    !tr.isdeleted
  );
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
};

export const getTransactionByTransferId = async (id: string, tenantId: string) => {
  const transaction = transactions.find(tr => 
    tr.transferid === id && 
    (tr.tenantid === tenantId || tenantId === "demo") && 
    !tr.isdeleted
  );
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return toTransactionsView(transaction);
};

export const getTransactionsByName = async (text: string, tenantId: string) => {
  const filtered = transactions.filter(tr => 
    tr.name?.toLowerCase().includes(text.toLowerCase()) && 
    (tr.tenantid === tenantId || tenantId === "demo") &&
    !tr.isdeleted
  );

  return filtered.slice(0, 7).map(transaction => ({
    label: transaction.name!,
    item: { ...transaction, amount: transaction.amount },
  }));
};

export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  // Validate referential integrity
  validateReferentialIntegrity.validateAccount(transaction.accountid);
  validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
  
  if (transaction.transferaccountid) {
    validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
  }
  if (transaction.transferid) {
    validateReferentialIntegrity.validateTransaction(transaction.transferid);
  }

  const newTransaction = {
    ...transaction,
    id: `tr-${Date.now()}`,
    amount: transaction.amount || 0,
    isdeleted: false,
    isvoid: false,
    createdat: new Date().toISOString(),
    createdby: transaction.createdby || "demo",
    updatedat: null,
    updatedby: null,
    tenantid: transaction.tenantid || "demo",
    type: transaction.type || "Expense",
  };
  
  transactions.push(newTransaction);
  return newTransaction;
};

export const createTransactions = async (txns: Inserts<TableNames.Transactions>[]) => {
  const createdTransactions = [];
  
  for (let i = 0; i < txns.length; i++) {
    const transaction = txns[i];
    
    // Validate referential integrity for each transaction
    validateReferentialIntegrity.validateAccount(transaction.accountid);
    validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
    
    if (transaction.transferaccountid) {
      validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
    }

    const newTransaction = {
      ...transaction,
      id: `tr-batch-${Date.now()}-${i}`,
      amount: transaction.amount || 0,
      isdeleted: false,
      isvoid: false,
      createdat: new Date().toISOString(),
      createdby: transaction.createdby || "demo",
      updatedat: null,
      updatedby: null,
      tenantid: transaction.tenantid || "demo",
      type: transaction.type || "Expense",
    };
    
    transactions.push(newTransaction);
    createdTransactions.push(newTransaction);
  }
  
  return createdTransactions;
};

export const createMultipleTransactions = async (txns: Inserts<TableNames.Transactions>[]) => {
  return createTransactions(txns); // Same implementation
};

export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const index = transactions.findIndex(tr => tr.id === transaction.id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }

  // Validate referential integrity if fields are being updated
  if (transaction.accountid) {
    validateReferentialIntegrity.validateAccount(transaction.accountid);
  }
  if (transaction.categoryid) {
    validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
  }
  if (transaction.transferaccountid) {
    validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
  }
  if (transaction.transferid) {
    validateReferentialIntegrity.validateTransaction(transaction.transferid);
  }

  transactions[index] = {
    ...transactions[index],
    ...transaction,
    updatedat: new Date().toISOString(),
  };
  
  return transactions[index];
};

export const updateTransferTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const index = transactions.findIndex(tr => tr.transferid === transaction.transferid);
  if (index === -1) {
    throw new Error("Transfer transaction not found");
  }

  // Validate referential integrity if fields are being updated
  if (transaction.accountid) {
    validateReferentialIntegrity.validateAccount(transaction.accountid);
  }
  if (transaction.categoryid) {
    validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
  }

  transactions[index] = {
    ...transactions[index],
    ...transaction,
    updatedat: new Date().toISOString(),
  };
  
  return transactions[index];
};

export const deleteTransaction = async (id: string, userId: string) => {
  const index = transactions.findIndex(tr => tr.id === id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  
  transactions[index].isdeleted = true;
  transactions[index].updatedby = userId;
  transactions[index].updatedat = new Date().toISOString();
  
  return transactions[index];
};

export const restoreTransaction = async (id: string, userId: string) => {
  const index = transactions.findIndex(tr => tr.id === id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  
  transactions[index].isdeleted = false;
  transactions[index].updatedby = userId;
  transactions[index].updatedat = new Date().toISOString();
  
  return transactions[index];
};
