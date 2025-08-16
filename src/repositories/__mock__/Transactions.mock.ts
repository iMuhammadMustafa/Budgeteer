// Mock implementation for Transactions API

import { Transaction, TransactionsView } from "@/src/types/db/Tables.Types";
import { transactions, accounts, transactionCategories, transactionGroups } from "./mockDataStore";

const toTransactionsView = (tr: Transaction): TransactionsView => {
  const account = accounts.find(acc => acc.id === tr.accountid) ?? null;
  const category = transactionCategories.find(cat => cat.id === tr.categoryid) ?? null;
  const group = category && category.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;
  return {
    accountid: tr.accountid,
    accountname: account?.name ?? null,
    amount: tr.amount,
    balance: null,
    categoryid: tr.categoryid,
    categoryname: category?.name ?? null,
    createdat: tr.createdat,
    currency: account?.currency ?? null,
    date: tr.date,
    groupicon: group?.icon ?? null,
    groupid: group?.id ?? null,
    groupname: group?.name ?? null,
    icon: category?.icon ?? null,
    id: tr.id,
    isvoid: tr.isvoid,
    name: tr.name,
    payee: tr.payee,
    runningbalance: null,
    tenantid: tr.tenantid,
    transferaccountid: tr.transferaccountid,
    transferid: tr.transferid,
    type: tr.type,
    updatedat: tr.updatedat,
  };
};

export const getAllTransactions = async (tenantId: string) => {
  return transactions.map(toTransactionsView);
};

export const getTransactions = async (searchFilters: any, tenantId: string) => {
  const { text, dateFrom, dateTo, type } = searchFilters;

  return transactions
    .filter(tr => tr.tenantid === tenantId)
    .filter(tr => {
      if (text) {
        return tr.name?.toLowerCase().includes(text.toLowerCase());
      }
      return true;
    })
    .filter(tr => {
      if (dateFrom && dateTo) {
        return tr.date >= dateFrom && tr.date <= dateTo;
      }
      return true;
    })
    .filter(tr => {
      if (type) {
        return tr.type === type;
      }
      return true;
    })
    .map(toTransactionsView);
};

export const getTransactionFullyById = async (transactionid: string, tenantId: string) => {
  const transaction = transactions.find(tr => tr.id === transactionid && tr.tenantid === tenantId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
};

export const getTransactionById = async (transactionid: string, tenantId: string) => {
  const transaction = transactions.find(tr => tr.id === transactionid && tr.tenantid === tenantId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
};

export const getTransactionByTransferId = async (id: string, tenantId: string) => {
  const transaction = transactions.find(tr => tr.transferid === id && tr.tenantid === tenantId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
};

export const getTransactionsByName = async (text: string, tenantId: string) => {
  return transactions.filter(tr => tr.name?.toLowerCase().includes(text.toLowerCase()) && tr.tenantid === tenantId);
};

export const createTransaction = async (transaction: any) => {
  const newTransaction = {
    ...transaction,
    transactionid: "mock-created",
  };
  transactions.push(newTransaction);
  return newTransaction;
};

export const createTransactions = async (txns: any[]) => {
  const createdTransactions = txns.map((t, i) => ({
    ...t,
    transactionid: `mock-created-${i}`,
  }));
  transactions.push(...createdTransactions);
  return createdTransactions;
};

export const createMultipleTransactions = async (txns: any[]) => {
  const createdTransactions = txns.map((t, i) => ({
    ...t,
    transactionid: `mock-multi-${i}`,
  }));
  transactions.push(...createdTransactions);
  return createdTransactions;
};

export const updateTransaction = async (transaction: any) => {
  const index = transactions.findIndex(tr => tr.id === transaction.id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  transactions[index] = {
    ...transactions[index],
    ...transaction,
    updated: true,
  };
  return transactions[index];
};

export const updateTransferTransaction = async (transaction: any) => {
  const index = transactions.findIndex(tr => tr.transferid === transaction.transferid);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  transactions[index] = {
    ...transactions[index],
    ...transaction,
    updated: true,
  };
  return transactions[index];
};

export const deleteTransaction = async (id: string, userId: string) => {
  const index = transactions.findIndex(tr => tr.id === id);
  if (index === -1) {
    throw new Error("Transaction not found");
  }
  transactions.splice(index, 1);
  return {
    id,
    deleted: true,
    updatedby: userId,
  };
};

export const restoreTransaction = async (id: string, userId: string) => {
  return {
    id,
    restored: true,
    updatedby: userId,
  };
};
