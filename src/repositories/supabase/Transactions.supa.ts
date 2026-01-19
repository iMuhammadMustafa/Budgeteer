import supabase from "@/src/providers/Supabase";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import {
  Inserts,
  SearchDistinctTransactions,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";

export class TransactionSupaRepository
  extends SupaRepository<Transaction, TableNames.Transactions>
  implements ITransactionRepository {
  protected tableName = TableNames.Transactions;
  protected orderByFieldsDesc = ["date"];


  async findAllFromView(tenantId: string, filters: TransactionFilters): Promise<TransactionsView[]> {
    let query = this.buildQuery(filters, tenantId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async findByIdFromView(id: string, tenantId?: string): Promise<TransactionsView | null> {
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

  async findByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
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

  async createMultiple(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]> {
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

  async findAllDeleted(
    tenantId: string,
    filters: { offset?: number; limit?: number },
  ): Promise<Transaction[]> {
    let query = supabase.from(TableNames.Transactions).select().eq("tenantid", tenantId).eq("isdeleted", true);

    if (filters.offset !== undefined && filters.limit !== undefined && filters.limit > 0 && filters.offset >= 0) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Transaction[];
  }

  /**
   * Gets the account balance at a specific date
   * Calculates balance by summing all transactions up to that date
   */
  async getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number> {
    // Use a stored procedure or RPC function for better performance
    // For now, we'll use a simple aggregation query
    const { data, error } = await supabase.rpc("get_account_balance_at_date", {
      p_account_id: accountId,
      p_date: date.toISOString(),
      p_tenant_id: tenantId,
    });

    if (error) {
      // Fallback to manual calculation if RPC doesn't exist
      console.warn("RPC function not available, using fallback calculation:", error.message);
      return await this.getAccountBalanceAtDateFallback(accountId, date, tenantId);
    }

    return data || 0;
  }

  /**
   * Fallback method for calculating account balance at date
   * Uses client-side aggregation if RPC function is not available
   */
  private async getAccountBalanceAtDateFallback(accountId: string, date: Date, tenantId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TableNames.Transactions)
      .select("amount")
      .eq("tenantid", tenantId)
      .eq("accountid", accountId)
      .eq("isdeleted", false)
      .lte("date", date.toISOString());

    if (error) throw new Error(error.message);

    // Sum all amounts
    const totalAmount = (data || []).reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);

    return totalAmount;
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
    if (searchFilters.groupid) {
      query = query.eq("groupid", searchFilters.groupid);
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
