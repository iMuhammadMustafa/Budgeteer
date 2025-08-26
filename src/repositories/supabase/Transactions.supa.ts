// Real implementation moved from Transactions.api.ts

import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import {
  Transaction,
  TransactionsView,
  SearchDistinctTransactions,
  Inserts,
  Updates,
} from "@/src/types/db/Tables.Types";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";
import { Database } from "@/src/types/db/database.types";

export class TransactionSupaRepository implements ITransactionRepository {
  async findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    let query = this.buildQuery(searchFilters, tenantId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string, tenantId?: string): Promise<TransactionsView | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("transactionid", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw new Error(error.message);
    }
    return data;
  }

  async create(data: Inserts<TableNames.Transactions>, tenantId?: string): Promise<Transaction> {
    const { data: result, error } = await supabase.from(TableNames.Transactions).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TableNames.Transactions>, tenantId?: string): Promise<Transaction | null> {
    const { data: result, error } = await supabase
      .from(TableNames.Transactions)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return result;
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase.from(TableNames.Transactions).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Transactions)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Transactions)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async upsert(data: Inserts<TableNames.Transactions> | Updates<TableNames.Transactions>): Promise<Transaction> {
    throw new Error("Not implemented");
  }

  async getByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("transferid", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
    const { data, error } = await supabase
      .from(ViewNames.SearchDistinctTransactions)
      .select()
      .eq("tenantid", tenantId)
      .ilike("name", `%${text}%`)
      .limit(7);

    if (error) throw error;

    return (
      data.map(transaction => ({
        label: transaction.name!,
        item: { ...transaction, amount: transaction.amount },
      })) ?? []
    );
  }

  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]> {
    //TODO Clean this
    const cleaned = transactions.map(t => {
      if ("mode" in t) {
        const { mode, ...rest } = t;
        return rest;
      }
      return t;
    });
    const { data, error } = await supabase.from(TableNames.Transactions).insert(cleaned).select();

    if (error) throw error;
    return data;
  }

  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction> {
    const { data, error } = await supabase
      .from(TableNames.Transactions)
      .update(transaction)
      .eq("transferid", transaction.transferid!)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findByDate(date: string, tenantId: string): Promise<TransactionsView[]> {
    // Convert the date to local timezone for the start and end of the day
    const startOfDay = dayjs(date).startOf("day").toISOString();
    const endOfDay = dayjs(date).endOf("day").toISOString();

    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select("*")
      .eq("tenantid", tenantId)
      // .eq("isdeleted", false)
      .gte("date", startOfDay)
      .lte("date", endOfDay)
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByCategory(categoryId: string, type: "category" | "group", tenantId: string): Promise<TransactionsView[]> {
    // Get the start and end of the current month in local timezone
    const startOfMonth = dayjs().startOf("month").toISOString();
    const endOfMonth = dayjs().endOf("month").toISOString();

    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select("*")
      .eq("tenantid", tenantId)
      // .eq("isdeleted", false)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .eq(type === "category" ? "categoryid" : "groupid", categoryId)
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByMonth(month: string, tenantId: string): Promise<TransactionsView[]> {
    // Convert the month to local timezone for the start and end of the month
    const startOfMonth = dayjs(month).startOf("month").toISOString();
    const endOfMonth = dayjs(month).endOf("month").toISOString();

    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select("*")
      .eq("tenantid", tenantId)
      // .eq("isdeleted", false)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  private buildQuery = (searchFilters: TransactionFilters, tenantId: string, isCount = false) => {
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
      searchFilters.offset !== undefined &&
      searchFilters.offset >= 0 &&
      searchFilters.limit !== undefined &&
      searchFilters.limit > 0
    ) {
      query = query.range(searchFilters.offset, searchFilters.offset + searchFilters.limit - 1);
    }

    return query;
  };
}

// Legacy functions for backward compatibility (can be removed after migration)
export const getAllTransactions = async (tenantId: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false);

  if (error) throw new Error(error.message);

  return data;
};

export const getTransactions = async (searchFilters: TransactionFilters, tenantId: string) => {
  const repository = new TransactionSupaRepository();
  return repository.findAll(searchFilters, tenantId);
};

const buildQuery = (searchFilters: TransactionFilters, tenantId: string, isCount = false) => {
  const repository = new TransactionSupaRepository();
  return repository["buildQuery"](searchFilters, tenantId, isCount);
};

export const getTransactionFullyById = async (transactionid: string, tenantId: string) => {
  const repository = new TransactionSupaRepository();
  return repository.findById(transactionid, tenantId);
};

export const getTransactionById = async (transactionid: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("transactionid", transactionid)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  const repository = new TransactionSupaRepository();
  return repository.create(transaction);
};

export const createTransactions = async (transactions: Inserts<TableNames.Transactions>[]) => {
  const repository = new TransactionSupaRepository();
  return repository.createMultipleTransactions(transactions);
};

export const createMultipleTransactions = async (transactions: Inserts<TableNames.Transactions>[]) => {
  const repository = new TransactionSupaRepository();
  return repository.createMultipleTransactions(transactions);
};

export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const repository = new TransactionSupaRepository();
  return repository.update(transaction.id!, transaction);
};

export const updateTransferTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const repository = new TransactionSupaRepository();
  return repository.updateTransferTransaction(transaction);
};

export const deleteTransaction = async (id: string, userId: string) => {
  const repository = new TransactionSupaRepository();
  return repository.softDelete(id);
};

export const restoreTransaction = async (id: string, userId: string) => {
  const repository = new TransactionSupaRepository();
  return repository.restore(id);
};
