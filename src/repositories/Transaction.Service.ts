import { Transaction } from "../data/entities";
import { createEntity, deleteEntity, getEntities, getEntity, updateEntity } from "./Helper.Service";

const TRANSACTION_ENDPOINT = 'transactions';

export async function createTransaction(data: Transaction): Promise<Transaction> {
  return createEntity<Transaction>(TRANSACTION_ENDPOINT, data);
}

export async function getTransaction(id: string): Promise<Transaction> {
  return getEntity<Transaction>(TRANSACTION_ENDPOINT, id);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return getEntities<Transaction>(TRANSACTION_ENDPOINT);
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
  return updateEntity<Transaction>(TRANSACTION_ENDPOINT, id, data);
}

export async function deleteTransaction(id: string): Promise<void> {
  return deleteEntity(TRANSACTION_ENDPOINT, id);
}