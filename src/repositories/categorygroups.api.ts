import { TableNames } from "../consts/TableNames";
import { supabase, Inserts, Updates } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export const createCategoryGroup = async (category: Inserts<TableNames.CategoryGroups>) => {
  const { data, error } = await supabase.from(TableNames.CategoryGroups).insert(category).select().single();
  if (error) throw error;
  return data;
};
export const updateCategoryGroup = async (category: Updates<TableNames.CategoryGroups>) => {
  const { data, error } = await supabase
    .from(TableNames.CategoryGroups)
    .update(category)
    .eq("id", category.id!)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const deleteCategoryGroup = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.CategoryGroups)
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
export const restoreCategoryGroup = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.CategoryGroups)
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
