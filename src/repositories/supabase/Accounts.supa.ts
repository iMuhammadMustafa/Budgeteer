import { FunctionNames, TableNames, ViewNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IAccountRepository } from "../interfaces/IAccountRepository";

export class AccountSupaRepository implements IAccountRepository {
  async findAll(filters?: any, tenantId?: string): Promise<Account[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Accounts)
      .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("category(displayorder)", { ascending: false })
      .order("displayorder", { ascending: false })
      .order("name")
      .order("owner");
    if (error) throw new Error(error.message);
    return data as unknown as Account[];
  }

  async findById(id: string, tenantId?: string): Promise<Account | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(ViewNames.ViewAccountsWithRunningBalance)
      .select(`*`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("id", id)
      .single();

    if (!data) return null;

    // Now fetch category manually
    const { data: category, error: categoryError } = await supabase
      .from(TableNames.AccountCategories)
      .select("*")
      .eq("id", data.categoryid!)
      .single();
    if (categoryError) throw new Error(categoryError.message);

    if (error) throw new Error(error);
    return {
      ...data,
      category,
    } as unknown as Account | null;
  }

  async create(data: Inserts<TableNames.Accounts>, tenantId?: string): Promise<Account> {
    const { data: result, error } = await supabase.from(TableNames.Accounts).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TableNames.Accounts>, tenantId?: string): Promise<Account | null> {
    const { data: result, error } = await supabase
      .from(TableNames.Accounts)
      .update({ ...data })
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
    const { error } = await supabase.from(TableNames.Accounts).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Accounts)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Accounts)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number> {
    const { data, error } = await supabase.rpc(FunctionNames.UpdateAccountBalance, {
      accountid,
      amount,
    });
    if (error) throw error;
    return data;
  }

  async getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Transactions)
      .select("id, amount")
      .eq("tenantid", tenantId)
      .eq("accountid", accountid)
      .eq("type", "Initial")
      .eq("isdeleted", false)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getTotalAccountBalance(tenantId?: string): Promise<{ totalbalance: number } | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

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
      throw new Error(error.message);
    }
    return data as { totalbalance: number } | null;
  }
}
