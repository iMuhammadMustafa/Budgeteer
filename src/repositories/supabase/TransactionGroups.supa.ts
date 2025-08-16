import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";

export class TransactionGroupSupaRepository implements ITransactionGroupRepository {
  async findAll(filters?: any, tenantId?: string): Promise<TransactionGroup[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.TransactionGroups)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string, tenantId?: string): Promise<TransactionGroup | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.TransactionGroups)
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

  async create(data: Inserts<TableNames.TransactionGroups>, tenantId?: string): Promise<TransactionGroup> {
    const { data: result, error } = await supabase.from(TableNames.TransactionGroups).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(
    id: string,
    data: Updates<TableNames.TransactionGroups>,
    tenantId?: string,
  ): Promise<TransactionGroup | null> {
    const { data: result, error } = await supabase
      .from(TableNames.TransactionGroups)
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
    const { error } = await supabase.from(TableNames.TransactionGroups).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionGroups)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionGroups)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }
}

// Legacy functions for backward compatibility (can be removed after migration)
export const getAllTransactionGroups = async (tenantId: string) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.findAll(undefined, tenantId);
};

export const getTransactionGroupById = async (id: string, tenantId: string) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.findById(id, tenantId);
};

export const createTransactionGroup = async (transactionGroup: Inserts<TableNames.TransactionGroups>) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.create(transactionGroup);
};

export const updateTransactionGroup = async (transactionGroup: Updates<TableNames.TransactionGroups>) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.update(transactionGroup.id!, transactionGroup);
};

export const deleteTransactionGroup = async (id: string, userId: string) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.softDelete(id);
};

export const restoreTransactionGroup = async (id: string, userId: string) => {
  const repository = new TransactionGroupSupaRepository();
  return repository.restore(id);
};
