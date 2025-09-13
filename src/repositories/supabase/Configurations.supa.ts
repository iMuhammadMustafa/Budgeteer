// Real implementation moved from Configurations.api.ts
import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { Configuration } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";

export class ConfigurationSupaRepository
  extends SupaRepository<Configuration, TableNames.Configurations>
  implements IConfigurationRepository
{
  protected tableName = TableNames.Configurations;
  async getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration> {
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
