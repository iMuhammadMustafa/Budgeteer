import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory as TransactionCategoryType } from "@/src/types/database/Tables.Types";
import { TransactionCategory } from "@/src/types/database/watermelon/models";
import { Q } from "@nozbe/watermelondb";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";
import { mapTransactionCategoryFromWatermelon } from "./TypeMappers";

export class TransactionCategoryWatermelonRepository
  extends BaseWatermelonRepository<TransactionCategory, TableNames.TransactionCategories, TransactionCategoryType>
  implements ITransactionCategoryRepository {
  protected tableName = TableNames.TransactionCategories;
  protected orderByField?: "displayorder";

  protected override mapFromWatermelon(model: TransactionCategory): TransactionCategoryType {
    return mapTransactionCategoryFromWatermelon(model);
  }

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

  async findAllWithGroup(tenantId: string, filters?: QueryFilters): Promise<TransactionCategoryType[]> {
    const db = await this.getDb();
    const conditions = [];

    conditions.push(Q.where("tenantid", tenantId));

    // isDeleted filter: null=all, true=deleted only, undefined/false=not deleted
    if (filters?.isDeleted === null) {
      // No filter - show all records
    } else if (filters?.isDeleted === true) {
      conditions.push(Q.where("isdeleted", true));
    } else {
      conditions.push(Q.where("isdeleted", false));
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "isDeleted") {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    const results = await db.get(this.tableName).query(...conditions, Q.sortBy("displayorder", "desc"));

    const categoriesWithGroups: TransactionCategoryType[] = [];
    for (const category of results as TransactionCategory[]) {
      const groupQuery = await db
        .get(TableNames.TransactionGroups)
        .query(
          Q.where("id", category.groupid),
          Q.where("isdeleted", false),
          Q.where("tenantid", tenantId),
          Q.sortBy("displayorder", "desc"),
        );

      const mappedCategory = mapTransactionCategoryFromWatermelon(category, groupQuery[0] as any);

      categoriesWithGroups.push(mappedCategory);
    }
    categoriesWithGroups.sort((b, a) => {
      const groupA = a.group?.displayorder ?? 0;
      const groupB = b.group?.displayorder ?? 0;
      if (groupA !== groupB) {
        return groupA - groupB;
      }
      const catA = a.displayorder ?? 0;
      const catB = b.displayorder ?? 0;
      return catA - catB;
    });

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

    const mappedCategory = mapTransactionCategoryFromWatermelon(model, groupQuery[0] as any);

    return mappedCategory;
  }
}
