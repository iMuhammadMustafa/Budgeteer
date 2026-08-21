import dayjs from "dayjs";

import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionItem } from "@/src/types/database/Tables.Types";

import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionItemRepository } from "../interfaces/ITransactionItemRepository";

export class TransactionItemSupaRepository
  extends SupaRepository<TransactionItem, TableNames.TransactionItems>
  implements ITransactionItemRepository
{
  protected tableName = TableNames.TransactionItems;
  protected orderByFieldsDesc = ["displayorder"];

  async findByTransactionId(transactionId: string, tenantId: string): Promise<TransactionItem[]> {
    const { data, error } = await supabase
      .from(TableNames.TransactionItems)
      .select()
      .eq("tenantid", tenantId)
      .eq("transactionid", transactionId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: true });

    if (error) throw new Error(error.message);
    return data as TransactionItem[];
  }

  async deleteByTransactionId(transactionId: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionItems)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("transactionid", transactionId)
      .eq("tenantid", tenantId);

    if (error) throw new Error(error.message);
  }

  async restoreByTransactionId(transactionId: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionItems)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("transactionid", transactionId)
      .eq("tenantid", tenantId);

    if (error) throw new Error(error.message);
  }

  async voidByTransactionId(transactionId: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(TableNames.TransactionItems)
      .update({
        isvoid: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("transactionid", transactionId)
      .eq("tenantid", tenantId);

    if (error) throw new Error(error.message);
  }
}
