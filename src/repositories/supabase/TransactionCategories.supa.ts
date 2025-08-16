import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategoryRepository implements ITransactionCategoryRepository {
  async findAll(filters?: any, tenantId?: string): Promise<TransactionCategory[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.TransactionCategories)
      .select(`*, group:${TableNames.TransactionGroups}!transactioncategories_groupid_fkey(*)`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: false })
      .order("group(displayorder)", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data as unknown as TransactionCategory[];
  }

  async findById(id: string, tenantId?: string): Promise<TransactionCategory | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.TransactionCategories)
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

  async create(data: Inserts<TableNames.TransactionCategories>, tenantId?: string): Promise<TransactionCategory> {
    const { data: result, error } = await supabase
      .from(TableNames.TransactionCategories)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(
    id: string,
    data: Updates<TableNames.TransactionCategories>,
    tenantId?: string,
  ): Promise<TransactionCategory | null> {
    const { data: result, error } = await supabase
      .from(TableNames.TransactionCategories)
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
    const { error } = await supabase.from(TableNames.TransactionCategories).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionCategories)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionCategories)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }
}

// Legacy functions for backward compatibility (can be removed after migration)
export const getAllTransactionCategories = async (tenantId: string) => {
  const repository = new TransactionCategoryRepository();
  return repository.findAll(undefined, tenantId);
};

export const getTransactionCategoryById = async (id: string, tenantId: string) => {
  const repository = new TransactionCategoryRepository();
  return repository.findById(id, tenantId);
};

export const createTransactionCategory = async (transactionCategory: Inserts<TableNames.TransactionCategories>) => {
  const repository = new TransactionCategoryRepository();
  return repository.create(transactionCategory);
};

export const updateTransactionCategory = async (transactionCategory: Updates<TableNames.TransactionCategories>) => {
  const repository = new TransactionCategoryRepository();
  return repository.update(transactionCategory.id!, transactionCategory);
};

export const deleteTransactionCategory = async (id: string, userId: string) => {
  const repository = new TransactionCategoryRepository();
  return repository.softDelete(id);
};

export const restoreTransactionCategory = async (id: string, userId: string) => {
  const repository = new TransactionCategoryRepository();
  return repository.restore(id);
};
