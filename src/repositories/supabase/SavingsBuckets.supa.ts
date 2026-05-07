import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { SavingsBucket } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ISavingsBucketRepository } from "../interfaces/ISavingsBucketRepository";

export class SavingsBucketSupaRepository
  extends SupaRepository<SavingsBucket, TableNames.SavingsBuckets>
  implements ISavingsBucketRepository {
  protected tableName = TableNames.SavingsBuckets;
  protected orderByFieldsDesc = ["displayorder"];

  async findByAccountId(accountId: string, tenantId: string): Promise<SavingsBucket[]> {
    const { data, error } = await supabase
      .from(TableNames.SavingsBuckets)
      .select()
      .eq("accountid", accountId)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .order("displayorder", { ascending: true })
      .order("name");

    if (error) throw error;
    return data as SavingsBucket[];
  }

  async getTotalAllocated(accountId: string, tenantId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TableNames.SavingsBuckets)
      .select("currentamount")
      .eq("accountid", accountId)
      .eq("tenantid", tenantId)
      .eq("isdeleted", false);

    if (error) throw error;

    return (data ?? []).reduce(
      (sum: number, row: { currentamount: number }) => sum + (row.currentamount ?? 0),
      0,
    );
  }
}
