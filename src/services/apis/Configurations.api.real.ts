// Real implementation moved from Configurations.api.ts
import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllConfigurations = async (tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Configurations)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false);
  if (error) throw new Error(error.message);
  return data;
};
export const getConfigurationById = async (id: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Configurations)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const getConfiguration = async (table: string, type: string, key: string, tenantId: string) => {
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
};

export const createConfiguration = async (configuration: Inserts<TableNames.Configurations>) => {
  const { data, error } = await supabase.from(TableNames.Configurations).insert(configuration).select().single();

  if (error) throw error;
  return data;
};

export const updateConfiguration = async (configuration: Updates<TableNames.Configurations>) => {
  const { data, error } = await supabase
    .from(TableNames.Configurations)
    .update({ ...configuration })
    .eq("id", configuration.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteConfiguration = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Configurations)
    .update({
      isdeleted: true,
      updatedby: userId,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const restoreConfiguration = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Configurations)
    .update({ isdeleted: false, updatedby: userId, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
