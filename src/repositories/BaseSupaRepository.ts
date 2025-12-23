import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { QueryFilters } from "../types/apis/QueryFilters";
import { IRepository } from "./interfaces/IRepository";

export abstract class SupaRepository<TModel, TTable extends TableNames> implements IRepository<TModel, TTable> {
  protected abstract tableName: string;

  async findAll(tenantId: string, filters: QueryFilters = {}): Promise<TModel[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", filters?.deleted ?? false)
      .order("displayorder", { ascending: false })
      .order("name");
    if (error) throw error;
    return data;
  }

  async findById(id: string, tenantId: string): Promise<TModel | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return data;
  }

  async create(data: Inserts<TTable>, tenantId: string): Promise<TModel> {
    const { data: result, error } = await supabase.from(this.tableName).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TTable>, tenantId: string): Promise<TModel | null> {
    const { data: result, error } = await supabase
      .from(this.tableName)
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

  async delete(id: string, tenantId: string): Promise<void> {
    // Default delete behavior is soft delete
    return this.softDelete(id, tenantId);
  }

  async hardDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id).eq("tenantid", tenantId);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }

  async restore(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id)
      .eq("tenantid", tenantId)
      .eq("isdeleted", true);
    if (error) throw error;
  }
}
