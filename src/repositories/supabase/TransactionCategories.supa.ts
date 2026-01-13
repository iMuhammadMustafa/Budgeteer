import supabase from "@/src/providers/Supabase";
import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategorySupaRepository
  extends SupaRepository<TransactionCategory, TableNames.TransactionCategories>
  implements ITransactionCategoryRepository {
  protected tableName = TableNames.TransactionCategories;

  async findAllWithGroup(tenantId: string, filters?: QueryFilters): Promise<TransactionCategory[]> {
    let query = supabase
      .from(TableNames.TransactionCategories)
      .select(`*, group:${TableNames.TransactionGroups}!transactioncategories_groupid_fkey(*)`)
      .eq("tenantid", tenantId);

    // isDeleted filter: null=all, true=deleted only, undefined/false=not deleted
    if (filters?.isDeleted === null) {
      // No filter - show all records
    } else if (filters?.isDeleted === true) {
      query = query.eq("isdeleted", true);
    } else {
      query = query.eq("isdeleted", false);
    }

    const { data, error } = await query
      .order("group(displayorder)", { ascending: false })
      .order("displayorder", { ascending: false })
      .order("name");
    if (error) throw error;
    return data as unknown as TransactionCategory[];
  }
}
