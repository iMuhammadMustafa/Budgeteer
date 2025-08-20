import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";
import { TransactionCategory } from "../../database/models";
import { TransactionCategory as TransactionCategoryType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapTransactionCategoryFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class TransactionCategoryWatermelonRepository
  extends BaseWatermelonRepository<
    TransactionCategory,
    Inserts<TableNames.TransactionCategories>,
    Updates<TableNames.TransactionCategories>,
    TransactionCategoryType
  >
  implements ITransactionCategoryRepository
{
  protected tableName = "transaction_categories";
  protected modelClass = TransactionCategory;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: TransactionCategory): TransactionCategoryType {
    return mapTransactionCategoryFromWatermelon(model);
  }

  // Override create to add group validation
  async create(data: Inserts<TableNames.TransactionCategories>, tenantId?: string): Promise<TransactionCategoryType> {
    try {
      const db = await this.getDb();

      // Validate that the group exists if groupid is provided
      if (data.groupid) {
        const groupExists = await db
          .get("transaction_groups")
          .query(
            Q.where("id", data.groupid),
            Q.where("isdeleted", false),
            ...(tenantId ? [Q.where("tenantid", tenantId)] : []),
          );

        if (groupExists.length === 0) {
          throw new Error(`TransactionGroup with ID ${data.groupid} does not exist or is deleted`);
        }
      }

      // Use base class create method
      return await super.create(data, tenantId);
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
