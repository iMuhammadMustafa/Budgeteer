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
    const { data: result, error } = await supabase
      .from(TableNames.AccountCategories)
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
    const { error } = await supabase.from(TableNames.AccountCategories).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.AccountCategories)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
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

// Legacy functions for backward compatibility (can be removed after migration)
export const getAllAccountCategories = async (tenantId: string) => {
  const repository = new AccountCategorySupaRepository();
  return repository.findAll(undefined, tenantId);
};

export const getAccountCategoryById = async (id: string, tenantId: string) => {
  const repository = new AccountCategorySupaRepository();
  return repository.findById(id, tenantId);
};

export const createAccountCategory = async (accountCategory: Inserts<TableNames.AccountCategories>) => {
  const repository = new AccountCategorySupaRepository();
  return repository.create(accountCategory);
};

export const updateAccountCategory = async (accountCategory: Updates<TableNames.AccountCategories>) => {
  const repository = new AccountCategorySupaRepository();
  return repository.update(accountCategory.id!, accountCategory);
};

export const deleteAccountCategory = async (id: string, userId: string) => {
  const repository = new AccountCategorySupaRepository();
  return repository.softDelete(id);
};

export const restoreAccountCategory = async (id: string, userId: string) => {
  const repository = new AccountCategorySupaRepository();
  return repository.restore(id);
};
