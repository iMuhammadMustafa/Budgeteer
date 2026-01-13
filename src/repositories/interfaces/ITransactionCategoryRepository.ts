import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ITransactionCategoryRepository
  extends IRepository<TransactionCategory, TableNames.TransactionCategories> {
  findAllWithGroup(tenantId: string, filters?: QueryFilters): Promise<TransactionCategory[]>;
}
