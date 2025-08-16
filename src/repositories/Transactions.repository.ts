import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/Transactions.supa";
import * as Mock from "./__mock__/Transactions.mock";

export const getAllTransactions = (...args: Parameters<typeof Real.getAllTransactions>) => {
  return getDemoMode() ? Mock.getAllTransactions(...args) : Real.getAllTransactions(...args);
};

export const getTransactions = (...args: Parameters<typeof Real.getTransactions>) => {
  return getDemoMode() ? Mock.getTransactions(...args) : Real.getTransactions(...args);
};

export const getTransactionFullyById = (...args: Parameters<typeof Real.getTransactionFullyById>) => {
  return getDemoMode() ? Mock.getTransactionFullyById(...args) : Real.getTransactionFullyById(...args);
};

export const getTransactionById = (...args: Parameters<typeof Real.getTransactionById>) => {
  return getDemoMode() ? Mock.getTransactionById(...args) : Real.getTransactionById(...args);
};

export const getTransactionByTransferId = (...args: Parameters<typeof Real.getTransactionByTransferId>) => {
  return getDemoMode() ? Mock.getTransactionByTransferId(...args) : Real.getTransactionByTransferId(...args);
};

export const getTransactionsByName = (...args: Parameters<typeof Real.getTransactionsByName>) => {
  return getDemoMode() ? Mock.getTransactionsByName(...args) : Real.getTransactionsByName(...args);
};

export const createTransaction = (...args: Parameters<typeof Real.createTransaction>) => {
  return getDemoMode() ? Mock.createTransaction(...args) : Real.createTransaction(...args);
};

export const createTransactions = (...args: Parameters<typeof Real.createTransactions>) => {
  return getDemoMode() ? Mock.createTransactions(...args) : Real.createTransactions(...args);
};

export const createMultipleTransactions = (...args: Parameters<typeof Real.createMultipleTransactions>) => {
  return getDemoMode() ? Mock.createMultipleTransactions(...args) : Real.createMultipleTransactions(...args);
};

export const updateTransaction = (...args: Parameters<typeof Real.updateTransaction>) => {
  return getDemoMode() ? Mock.updateTransaction(...args) : Real.updateTransaction(...args);
};

export const updateTransferTransaction = (...args: Parameters<typeof Real.updateTransferTransaction>) => {
  return getDemoMode() ? Mock.updateTransferTransaction(...args) : Real.updateTransferTransaction(...args);
};

export const deleteTransaction = (...args: Parameters<typeof Real.deleteTransaction>) => {
  return getDemoMode() ? Mock.deleteTransaction(...args) : Real.deleteTransaction(...args);
};

export const restoreTransaction = (...args: Parameters<typeof Real.restoreTransaction>) => {
  return getDemoMode() ? Mock.restoreTransaction(...args) : Real.restoreTransaction(...args);
};
