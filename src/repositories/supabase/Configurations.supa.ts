// Real implementation moved from Configurations.api.ts
import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";

export class ConfigurationSupaRepository implements IConfigurationRepository {
  async findAll(filters?: any, tenantId?: string): Promise<Configuration[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Configurations)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false);
    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string, tenantId?: string): Promise<Configuration | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Configurations)
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

  async create(data: Inserts<TableNames.Configurations>, tenantId?: string): Promise<Configuration> {
    const { data: result, error } = await supabase.from(TableNames.Configurations).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TableNames.Configurations>, tenantId?: string): Promise<Configuration | null> {
    const { data: result, error } = await supabase
      .from(TableNames.Configurations)
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
    const { error } = await supabase.from(TableNames.Configurations).delete().eq("id", id);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Configurations)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.Configurations)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<Configuration> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Configurations)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .ilike('"table"', table)
      .ilike("type", type)
      .ilike("key", key)
      .limit(1)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
