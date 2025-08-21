import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";

export class AccountCategorySupaRepository implements IAccountCategoryRepository {
  async findAll(filters?: any, tenantId?: string): Promise<AccountCategory[]> {
    if (!tenantId) throw new Error("Tenant ID is required");
    const { data, error } = await supabase
      .from(TableNames.AccountCategories)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string, tenantId?: string): Promise<AccountCategory | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.AccountCategories)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw new Error(error.message);
    }
    return data;
  }

  async create(data: Inserts<TableNames.AccountCategories>, tenantId?: string): Promise<AccountCategory> {
    const { data: result, error } = await supabase.from(TableNames.AccountCategories).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(
    id: string,
    data: Updates<TableNames.AccountCategories>,
    tenantId?: string,
  ): Promise<AccountCategory | null> {
    if (!tenantId) throw new Error("Tenant ID is required");
    const { data: result, error } = await supabase
      .from(TableNames.AccountCategories)
      .update({ ...data })
      .eq("id", id)
      .eq("tenantid", tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return result;
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");
    const { error } = await supabase.from(TableNames.AccountCategories).delete().eq("id", id).eq("tenantid", tenantId);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");
    const { error } = await supabase
      .from(TableNames.AccountCategories)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.AccountCategories)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }
}
