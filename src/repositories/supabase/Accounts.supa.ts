import supabase from "@/src/providers/Supabase";
import { FunctionNames, TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Account } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { IAccountRepository } from "../interfaces/IAccountRepository";

export class AccountSupaRepository extends SupaRepository<Account, TableNames.Accounts> implements IAccountRepository {
  protected tableName = TableNames.Accounts;

  override async findAll(tenantId: string, filters: { deleted?: boolean } = {}): Promise<Account[]> {
    const { data, error } = await supabase
      .from(TableNames.Accounts)
      .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", filters?.deleted ?? false)
      .order("category(displayorder)", { ascending: false })
      .order("displayorder", { ascending: false })
      .order("name")
      .order("owner");
    if (error) throw error;
    return data as unknown as Account[];
  }

  override async findById(id: string, tenantId: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from(ViewNames.ViewAccountsWithRunningBalance)
      .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return data;
  }

  async updateAccountBalance(accountid: string, amount: number, tenantId: string): Promise<number> {
    const { data, error } = await supabase.rpc(FunctionNames.UpdateAccountBalance, {
      accountid,
      amount,
    });
    if (error) throw error;
    return data;
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }> {
    const { data, error } = await supabase
      .from(TableNames.Transactions)
      .select("id, amount")
      .eq("tenantid", tenantId)
      .eq("accountid", accountid)
      .eq("type", "Initial")
      .eq("isdeleted", false)
      .single();

    if (error) throw error;
    return data;
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    const { data, error } = await supabase
      .from(ViewNames.StatsTotalAccountBalance)
      .select("totalbalance")
      .eq("tenantid", tenantId)
      .single();

    if (error) {
      // If the error is because no rows were found, it's not a critical error, return null
      if (error.code === "PGRST116") {
        return { totalbalance: 0 }; // Or return null if you prefer to indicate no data vs zero balance
      }
      throw error;
    }
    return data as { totalbalance: number } | null;
  }

  async getAccountRunningBalance(accountid: string, tenantId: string): Promise<{ runningbalance: number } | null> {
    const { data, error } = await supabase
      .from(ViewNames.ViewAccountsWithRunningBalance)
      .select("runningbalance")
      .eq("tenantid", tenantId)
      .eq("id", accountid)
      .single();
    if (error) throw error;
    return data as { runningbalance: number } | null;
  }
}
