import { SearchableDropdownItem } from "../../components/SearchableDropdown";
import { TableNames, ViewNames } from "../../consts/TableNames";
import { supabase, Inserts, Updates } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";

export const createCategory = async (category: Inserts<TableNames.Categories>) => {
  const { data, error } = await supabase.from(TableNames.Categories).insert(category).select().single();
  if (error) throw error;
  return data;
};
export const updateCategory = async (category: Updates<TableNames.Categories>) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
    .update(category)
    .eq("id", category.id!)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const deleteCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
    .update({
      isdeleted: true,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
export const restoreCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
    .update({
      isdeleted: false,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getCategoryAndGroups = async () => {
  const { data, error } = await supabase.from(ViewNames.CategoryAndGroups).select("group, groupicon");

  if (error) throw error;

  return data;
};
