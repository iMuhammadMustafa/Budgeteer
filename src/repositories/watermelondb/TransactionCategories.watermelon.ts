import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";
import { TransactionCategory, TransactionGroup } from "../../database/models";
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
  protected tableName = TableNames.TransactionCategories;
  protected modelClass = TransactionCategory;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: TransactionCategory): TransactionCategoryType {
    return mapTransactionCategoryFromWatermelon(model);
  }

  // Override findAll to include group relationship
  async findAll(filters?: any, tenantId?: string): Promise<TransactionCategoryType[]> {
    try {
      const db = await this.getDb();
      const conditions = [];
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(Q.where(tenantField, tenantId));
      }

      // Add soft delete filtering
      conditions.push(Q.where(softDeleteField, false));

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any));
          }
        });
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      // Fetch related groups for all categories
      const categoriesWithGroups: TransactionCategoryType[] = [];
      for (const category of results as TransactionCategory[]) {
        const groupQuery = db
          .get(TableNames.TransactionGroups)
          .query(Q.where("id", category.groupid), Q.where("isdeleted", false));
        const groupResults = await groupQuery;
        const group = groupResults[0] as TransactionGroup | undefined;

        const mappedCategory = this.mapFromWatermelon(category);
        if (group) {
          // Add group data to the mapped category
          (mappedCategory as any).group = {
            id: group.id,
            name: group.name,
            type: group.type,
            color: group.color,
            icon: group.icon,
            description: group.description || null,
            displayorder: group.displayorder,
            budgetamount: group.budgetamount,
            budgetfrequency: group.budgetfrequency,
            tenantid: group.tenantid,
            isdeleted: group.isdeleted,
            createdat: new Date(group.createdat).toISOString(),
            createdby: group.createdby || null,
            updatedat: new Date(group.updatedat).toISOString(),
            updatedby: group.updatedby || null,
          };
        }
        categoriesWithGroups.push(mappedCategory);
      }

      return categoriesWithGroups;
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Override findById to include group relationship
  async findById(id: string, tenantId?: string): Promise<TransactionCategoryType | null> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const query = db.get(this.tableName).query(
        Q.where("id", id),
        // Add tenant filtering if tenantId is provided
        ...(tenantId ? [Q.where(tenantField, tenantId)] : []),
        // Add soft delete filtering
        Q.where(softDeleteField, false),
      );

      const results = await query;
      const model = results[0] as TransactionCategory;
      if (!model) return null;

      // Fetch the related group
      const groupQuery = db
        .get(TableNames.TransactionGroups)
        .query(Q.where("id", model.groupid), Q.where("isdeleted", false));
      const groupResults = await groupQuery;
      const group = groupResults[0] as TransactionGroup | undefined;

      const mappedCategory = this.mapFromWatermelon(model);
      if (group) {
        // Add group data to the mapped category
        (mappedCategory as any).group = {
          id: group.id,
          name: group.name,
          type: group.type,
          color: group.color,
          icon: group.icon,
          description: group.description || null,
          displayorder: group.displayorder,
          budgetamount: group.budgetamount,
          budgetfrequency: group.budgetfrequency,
          tenantid: group.tenantid,
          isdeleted: group.isdeleted,
          createdat: new Date(group.createdat).toISOString(),
          createdby: group.createdby || null,
          updatedat: new Date(group.updatedat).toISOString(),
          updatedby: group.updatedby || null,
        };
      }

      return mappedCategory;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Override create to add group validation
  async create(data: Inserts<TableNames.TransactionCategories>, tenantId?: string): Promise<TransactionCategoryType> {
    try {
      const db = await this.getDb();

      // Validate that the group exists if groupid is provided
      if (data.groupid) {
        const groupExists = await db
          .get(TableNames.TransactionGroups)
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
