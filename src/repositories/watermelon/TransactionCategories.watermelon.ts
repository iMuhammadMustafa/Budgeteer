import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory as TransactionCategoryType } from "@/src/types/database/Tables.Types";
import { TransactionCategory, TransactionGroup } from "@/src/types/database/watermelon/models";
import { Q } from "@nozbe/watermelondb";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategoryWatermelonRepository
  extends BaseWatermelonRepository<TransactionCategory, TableNames.TransactionCategories, TransactionCategoryType>
  implements ITransactionCategoryRepository
{
  protected tableName = TableNames.TransactionCategories;

  override mapFieldsForWatermelon(data: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case "budgetamount":
          mapped[key] = Number(value) || 0;
          break;
        case "group":
          break;
        default:
          mapped[key] = value;
      }
    });

    return mapped;
  }

  override async findAll(tenantId: string, filters?: any): Promise<TransactionCategoryType[]> {
    const db = await this.getDb();
    const conditions = [];

    conditions.push(Q.where("tenantid", tenantId));
    conditions.push(Q.where("isdeleted", false));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    const results = await db.get(this.tableName).query(...conditions);

    const categoriesWithGroups: TransactionCategoryType[] = [];
    for (const category of results as TransactionCategory[]) {
      const groupQuery = await db
        .get(TableNames.TransactionGroups)
        .query(Q.where("id", category.groupid), Q.where("isdeleted", false), Q.where("tenantid", tenantId));

      const mappedCategory = this.mapFromWatermelon(category);
      mappedCategory.group = groupQuery[0] as TransactionGroup | undefined;

      categoriesWithGroups.push(mappedCategory);
    }

    return categoriesWithGroups;
  }

  override async findById(id: string, tenantId: string): Promise<TransactionCategoryType | null> {
    const db = await this.getDb();

    const query = db
      .get(this.tableName)
      .query(Q.where("id", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const model = (await query)[0] as TransactionCategory;
    if (!model) return null;

    const groupQuery = await db
      .get(TableNames.TransactionGroups)
      .query(Q.where("id", model.groupid), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const mappedCategory = this.mapFromWatermelon(model);
    mappedCategory.group = groupQuery[0] as TransactionGroup | undefined;

    return mappedCategory;
  }
}
