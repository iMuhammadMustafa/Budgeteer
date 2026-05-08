import { TableNames } from "@/src/types/database/TableNames";
import { SavingsBucket } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ISavingsBucketRepository extends IRepository<SavingsBucket, TableNames.SavingsBuckets> {
  findByAccountId(accountId: string, tenantId: string): Promise<SavingsBucket[]>;
  getTotalAllocated(accountId: string, tenantId: string): Promise<number>;
}
