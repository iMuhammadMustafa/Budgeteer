import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategorySupaRepository
  extends SupaRepository<TransactionCategory, TableNames.TransactionCategories>
  implements ITransactionCategoryRepository
{
  protected tableName = TableNames.TransactionCategories;

  override async findAll(tenantId: string, filters?: any): Promise<TransactionCategory[]> {
    const { data, error } = await supabase
      .from(TableNames.TransactionCategories)
      .select(`*, group:${TableNames.TransactionGroups}!transactioncategories_groupid_fkey(*)`)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: false })
      .order("group(displayorder)", { ascending: false })
      .order("name");
    if (error) throw error;
    return data as unknown as TransactionCategory[];
  }
}
