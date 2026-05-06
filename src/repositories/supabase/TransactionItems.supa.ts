import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionItem } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionItemRepository } from "../interfaces/ITransactionItemRepository";

export class TransactionItemSupaRepository
  extends SupaRepository<TransactionItem, TableNames.TransactionItems>
  implements ITransactionItemRepository {
  protected tableName = TableNames.TransactionItems;
  protected orderByFieldsDesc = ["createdat"];

  async findByTransactionId(transactionId: string, tenantId: string): Promise<TransactionItem[]> {
    const { data, error } = await supabase
      .from(TableNames.TransactionItems)
      .select()
      .eq("transactionid", transactionId)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("createdat", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }
}
