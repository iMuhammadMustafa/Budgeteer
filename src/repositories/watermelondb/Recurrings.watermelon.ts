import { IRecurringRepository } from "../interfaces/IRecurringRepository";
import { Recurring, Account, TransactionCategory } from "../../database/models";
import { Recurring as RecurringType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapRecurringFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { Q } from "@nozbe/watermelondb";

export class RecurringWatermelonRepository
  extends BaseWatermelonRepository<
    Recurring,
    Inserts<TableNames.Recurrings>,
    Updates<TableNames.Recurrings>,
    RecurringType
  >
  implements IRecurringRepository
{
  protected tableName = TableNames.Recurrings;
  protected modelClass = Recurring;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: Recurring): RecurringType {
    return mapRecurringFromWatermelon(model);
  }

  // Override findAll to include account and category relationships
  async findAll(filters?: any, tenantId?: string): Promise<RecurringType[]> {
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

      // Fetch related accounts and categories for all recurrings
      const recurringsWithRelations: RecurringType[] = [];
      for (const recurring of results as Recurring[]) {
        // Fetch source account
        const accountQuery = db
          .get(TableNames.Accounts)
          .query(Q.where("id", recurring.sourceaccountid), Q.where("isdeleted", false));
        const accountResults = await accountQuery;
        const sourceAccount = accountResults[0] as Account | undefined;

        // Fetch category if categoryid exists
        let category: TransactionCategory | undefined;
        if (recurring.categoryid) {
          const categoryQuery = db
            .get(TableNames.TransactionCategories)
            .query(Q.where("id", recurring.categoryid), Q.where("isdeleted", false));
          const categoryResults = await categoryQuery;
          category = categoryResults[0] as TransactionCategory | undefined;
        }

        const mappedRecurring = this.mapFromWatermelon(recurring);

        // Add source account data
        if (sourceAccount) {
          (mappedRecurring as any).source_account = {
            id: sourceAccount.id,
            name: sourceAccount.name,
            categoryid: sourceAccount.categoryid,
            balance: sourceAccount.balance,
            currency: sourceAccount.currency,
            color: sourceAccount.color,
            icon: sourceAccount.icon,
            description: sourceAccount.description || null,
            notes: sourceAccount.notes || null,
            owner: sourceAccount.owner || null,
            displayorder: sourceAccount.displayorder,
            tenantid: sourceAccount.tenantid,
            isdeleted: sourceAccount.isdeleted,
            createdat: new Date(sourceAccount.createdat).toISOString(),
            createdby: sourceAccount.createdby || null,
            updatedat: new Date(sourceAccount.updatedat).toISOString(),
            updatedby: sourceAccount.updatedby || null,
          };
        }

        // Add category data if exists
        if (category) {
          (mappedRecurring as any).category = {
            id: category.id,
            name: category.name || null,
            groupid: category.groupid,
            type: category.type,
            color: category.color,
            icon: category.icon,
            description: category.description || null,
            displayorder: category.displayorder,
            budgetamount: category.budgetamount,
            budgetfrequency: category.budgetfrequency,
            tenantid: category.tenantid,
            isdeleted: category.isdeleted,
            createdat: new Date(category.createdat).toISOString(),
            createdby: category.createdby || null,
            updatedat: new Date(category.updatedat).toISOString(),
            updatedby: category.updatedby || null,
          };
        }

        recurringsWithRelations.push(mappedRecurring);
      }

      return recurringsWithRelations;
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Override findById to include account and category relationships
  async findById(id: string, tenantId?: string): Promise<RecurringType | null> {
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
      const model = results[0] as Recurring;
      if (!model) return null;

      // Fetch the related source account
      const accountQuery = db
        .get(TableNames.Accounts)
        .query(Q.where("id", model.sourceaccountid), Q.where("isdeleted", false));
      const accountResults = await accountQuery;
      const sourceAccount = accountResults[0] as Account | undefined;

      // Fetch the related category if categoryid exists
      let category: TransactionCategory | undefined;
      if (model.categoryid) {
        const categoryQuery = db
          .get(TableNames.TransactionCategories)
          .query(Q.where("id", model.categoryid), Q.where("isdeleted", false));
        const categoryResults = await categoryQuery;
        category = categoryResults[0] as TransactionCategory | undefined;
      }

      const mappedRecurring = this.mapFromWatermelon(model);

      // Add source account data
      if (sourceAccount) {
        (mappedRecurring as any).source_account = {
          id: sourceAccount.id,
          name: sourceAccount.name,
          categoryid: sourceAccount.categoryid,
          balance: sourceAccount.balance,
          currency: sourceAccount.currency,
          color: sourceAccount.color,
          icon: sourceAccount.icon,
          description: sourceAccount.description || null,
          notes: sourceAccount.notes || null,
          owner: sourceAccount.owner || null,
          displayorder: sourceAccount.displayorder,
          tenantid: sourceAccount.tenantid,
          isdeleted: sourceAccount.isdeleted,
          createdat: new Date(sourceAccount.createdat).toISOString(),
          createdby: sourceAccount.createdby || null,
          updatedat: new Date(sourceAccount.updatedat).toISOString(),
          updatedby: sourceAccount.updatedby || null,
        };
      }

      // Add category data if exists
      if (category) {
        (mappedRecurring as any).category = {
          id: category.id,
          name: category.name || null,
          groupid: category.groupid,
          type: category.type,
          color: category.color,
          icon: category.icon,
          description: category.description || null,
          displayorder: category.displayorder,
          budgetamount: category.budgetamount,
          budgetfrequency: category.budgetfrequency,
          tenantid: category.tenantid,
          isdeleted: category.isdeleted,
          createdat: new Date(category.createdat).toISOString(),
          createdby: category.createdby || null,
          updatedat: new Date(category.updatedat).toISOString(),
          updatedby: category.updatedby || null,
        };
      }

      return mappedRecurring;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
