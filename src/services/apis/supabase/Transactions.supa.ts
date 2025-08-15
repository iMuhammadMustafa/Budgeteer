// Real implementation moved from Transactions.api.ts

import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Transaction, TransactionsView, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { ITransactionProvider } from "@/src/types/storage/providers/ITransactionProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseTransactionProvider implements ITransactionProvider {
  readonly mode: StorageMode = StorageMode.Cloud;
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

  async getAllTransactions(tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.TransactionsView)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getAllTransactions",
            table: "transactions",
            tenantId,
          });
        }

        return data as TransactionsView[];
      },
      {
        storageMode: "cloud",
        operation: "getAllTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  async getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        let query = this.buildQuery(searchFilters, tenantId);
        const { data, error } = await query;

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getTransactions",
            table: "transactions",
            tenantId,
            filters: searchFilters,
          });
        }

        return data as TransactionsView[];
      },
      {
        storageMode: "cloud",
        operation: "getTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  private buildQuery(searchFilters: TransactionFilters, tenantId: string, isCount = false) {
    let query = supabase.from(ViewNames.TransactionsView).select().eq("tenantid", tenantId);

    if (isCount) {
      query = supabase
        .from(ViewNames.TransactionsView)
        .select("*", { count: "exact", head: true })
        .eq("tenantid", tenantId);
    }

    if (searchFilters.startDate) {
      query = query.gte("date", searchFilters.startDate);
    }
    if (searchFilters.endDate) {
      query = query.lte("date", searchFilters.endDate);
    }
    if (searchFilters.name) {
      query = query.ilike("name", searchFilters.name);
    }
    if (searchFilters.description) {
      query = query.ilike("description", searchFilters.description);
    }
    if (searchFilters.amount) {
      query = query.eq("amount", searchFilters.amount);
    }
    if (searchFilters.categoryid) {
      query = query.eq("categoryid", searchFilters.categoryid);
    }
    if (searchFilters.accountid) {
      query = query.eq("accountid", searchFilters.accountid);
    }
    if (searchFilters.isVoid) {
      query = query.eq("isVoid", searchFilters.isVoid);
    }
    if (searchFilters.type) {
      query = query.eq("type", searchFilters.type);
    }
    if (searchFilters.tags && searchFilters.tags.length > 0) {
      query = query.in("tags", searchFilters.tags);
    }

    if (
      searchFilters.startIndex !== undefined &&
      searchFilters.startIndex >= 0 &&
      searchFilters.endIndex !== undefined &&
      searchFilters.endIndex >= 0
    ) {
      query = query.range(searchFilters.startIndex, searchFilters.endIndex);
    }

    return query;
  }

  async getTransactionFullyById(transactionid: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.TransactionsView)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("transactionid", transactionid)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getTransactionFullyById",
            table: "transactions",
            recordId: transactionid,
            tenantId,
          });
        }

        return data as TransactionsView;
      },
      {
        storageMode: "cloud",
        operation: "getTransactionFullyById",
        table: "transactions",
        recordId: transactionid,
        tenantId,
      },
    );
  }

  async getTransactionById(transactionid: string, tenantId: string): Promise<Transaction | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("transactionid", transactionid)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getTransactionById",
            table: "transactions",
            recordId: transactionid,
            tenantId,
          });
        }

        return data as Transaction;
      },
      {
        storageMode: "cloud",
        operation: "getTransactionById",
        table: "transactions",
        recordId: transactionid,
        tenantId,
      },
    );
  }

  async getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.TransactionsView)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("transferid", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getTransactionByTransferId",
            table: "transactions",
            recordId: id,
            tenantId,
          });
        }

        return data as TransactionsView;
      },
      {
        storageMode: "cloud",
        operation: "getTransactionByTransferId",
        table: "transactions",
        recordId: id,
        tenantId,
      },
    );
  }

  async getTransactionsByName(text: string, tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.SearchDistinctTransactions)
          .select()
          .eq("tenantid", tenantId)
          .ilike("name", `%${text}%`)
          .limit(7);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getTransactionsByName",
            table: "transactions",
            tenantId,
            searchText: text,
          });
        }

        return (
          data.map(transaction => ({
            label: transaction.name!,
            item: { ...transaction, amount: transaction.amount },
          })) ?? []
        );
      },
      {
        storageMode: "cloud",
        operation: "getTransactionsByName",
        table: "transactions",
        tenantId,
      },
    );
  }

  async createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase.from(TableNames.Transactions).insert(transaction).select().single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createTransaction",
            table: "transactions",
            data: transaction,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createTransaction",
        table: "transactions",
      },
    );
  }

  async createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase.from(TableNames.Transactions).insert(transactions).select();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createTransactions",
            table: "transactions",
            data: transactions,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createTransactions",
        table: "transactions",
      },
    );
  }

  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase.from(TableNames.Transactions).insert(transactions).select();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createMultipleTransactions",
            table: "transactions",
            data: transactions,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createMultipleTransactions",
        table: "transactions",
      },
    );
  }

  async updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .update(transaction)
          .eq("id", transaction.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateTransaction",
            table: "transactions",
            recordId: transaction.id,
            data: transaction,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "updateTransaction",
        table: "transactions",
        recordId: transaction.id,
      },
    );
  }

  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .update(transaction)
          .eq("transferid", transaction.transferid!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateTransferTransaction",
            table: "transactions",
            transferId: transaction.transferid,
            data: transaction,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "updateTransferTransaction",
        table: "transactions",
        recordId: transaction.transferid ?? undefined,
      },
    );
  }

  async deleteTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .update({
            isdeleted: true,
            updatedby: userId,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "deleteTransaction",
            table: "transactions",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "deleteTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }

  async restoreTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .update({
            isdeleted: false,
            updatedby: userId,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          })
          .eq("id", id);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "restoreTransaction",
            table: "transactions",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "restoreTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const supabaseTransactionProvider = new SupabaseTransactionProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getAllTransactions = supabaseTransactionProvider.getAllTransactions.bind(supabaseTransactionProvider);
export const getTransactions = supabaseTransactionProvider.getTransactions.bind(supabaseTransactionProvider);
export const getTransactionFullyById =
  supabaseTransactionProvider.getTransactionFullyById.bind(supabaseTransactionProvider);
export const getTransactionById = supabaseTransactionProvider.getTransactionById.bind(supabaseTransactionProvider);
export const getTransactionByTransferId =
  supabaseTransactionProvider.getTransactionByTransferId.bind(supabaseTransactionProvider);
export const getTransactionsByName =
  supabaseTransactionProvider.getTransactionsByName.bind(supabaseTransactionProvider);
export const createTransaction = supabaseTransactionProvider.createTransaction.bind(supabaseTransactionProvider);
export const createTransactions = supabaseTransactionProvider.createTransactions.bind(supabaseTransactionProvider);
export const createMultipleTransactions =
  supabaseTransactionProvider.createMultipleTransactions.bind(supabaseTransactionProvider);
export const updateTransaction = supabaseTransactionProvider.updateTransaction.bind(supabaseTransactionProvider);
export const updateTransferTransaction =
  supabaseTransactionProvider.updateTransferTransaction.bind(supabaseTransactionProvider);
export const deleteTransaction = supabaseTransactionProvider.deleteTransaction.bind(supabaseTransactionProvider);
export const restoreTransaction = supabaseTransactionProvider.restoreTransaction.bind(supabaseTransactionProvider);
