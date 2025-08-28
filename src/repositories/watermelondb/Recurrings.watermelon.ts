import { IRecurringRepository } from "../interfaces/IRecurringRepository";
import { Recurring, Account, TransactionCategory } from "../../database/models";
import { Recurring as RecurringType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapRecurringFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { Q } from "@nozbe/watermelondb";
import { 
  RecurringFilters
} from "@/src/types/recurring";
import { RecurringType as RecurringTypeEnum } from "@/src/types/enums/recurring";

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

  // Helper method to map WatermelonDB model to Recurring with relationships
  private async mapToRecurring(model: Recurring): Promise<Recurring> {
    const db = await this.getDb();
    
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

    const mappedRecurring = this.mapFromWatermelon(model) as Recurring;

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
  }

  // Query methods for due transactions and auto-apply filtering
  async findDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]> {
    try {
      const db = await this.getDb();
      const checkDate = asOfDate || new Date();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const conditions = [
        Q.where(tenantField, tenantId),
        Q.where(softDeleteField, false),
        Q.where("isactive", true),
        Q.where("nextoccurrencedate", Q.lte(checkDate.getTime()))
      ];

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      const recurrings: Recurring[] = [];
      for (const recurring of results as Recurring[]) {
        const mapped = await this.mapToRecurring(recurring);
        recurrings.push(mapped);
      }

      return recurrings.sort((a, b) => 
        new Date(a.nextoccurrencedate).getTime() - new Date(b.nextoccurrencedate).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to find due recurring transactions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findByAutoApplyEnabled(tenantId: string, enabled: boolean): Promise<Recurring[]> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const conditions = [
        Q.where(tenantField, tenantId),
        Q.where(softDeleteField, false),
        Q.where("autoapplyenabled", enabled)
      ];

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      const recurrings: Recurring[] = [];
      for (const recurring of results as Recurring[]) {
        const mapped = await this.mapToRecurring(recurring);
        recurrings.push(mapped);
      }

      return recurrings.sort((a, b) => 
        new Date(a.nextoccurrencedate).getTime() - new Date(b.nextoccurrencedate).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to find recurring transactions by auto-apply status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findByRecurringType(tenantId: string, type: RecurringTypeEnum): Promise<Recurring[]> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const conditions = [
        Q.where(tenantField, tenantId),
        Q.where(softDeleteField, false),
        Q.where("recurringtype", type)
      ];

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      const recurrings: Recurring[] = [];
      for (const recurring of results as Recurring[]) {
        const mapped = await this.mapToRecurring(recurring);
        recurrings.push(mapped);
      }

      return recurrings.sort((a, b) => 
        new Date(a.nextoccurrencedate).getTime() - new Date(b.nextoccurrencedate).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to find recurring transactions by type: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Filtering with new criteria
  async findAllFiltered(filters?: RecurringFilters, tenantId?: string): Promise<Recurring[]> {
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

      // Apply enhanced filters
      if (filters) {
        if (filters.recurringType !== undefined) {
          conditions.push(Q.where("recurringtype", filters.recurringType));
        }
        if (filters.autoApplyEnabled !== undefined) {
          conditions.push(Q.where("autoapplyenabled", filters.autoApplyEnabled));
        }
        if (filters.isActive !== undefined) {
          conditions.push(Q.where("isactive", filters.isActive));
        }
        if (filters.isDue && filters.asOfDate) {
          conditions.push(Q.where("nextoccurrencedate", Q.lte(filters.asOfDate.getTime())));
        }
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      const recurrings: Recurring[] = results as Recurring[];

      return recurrings.sort((a, b) => {
        const dateComparison = new Date(a.nextoccurrencedate).getTime() - new Date(b.nextoccurrencedate).getTime();
        if (dateComparison !== 0) return dateComparison;
        return (a.name || '').localeCompare(b.name || '');
      });
    } catch (error) {
      throw new Error(`Failed to find recurring transactions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Batch operation methods for updating next occurrence dates and failed attempts
  async updateNextOccurrenceDates(updates: { id: string; nextDate: Date }[]): Promise<void> {
    if (updates.length === 0) return;

    try {
      const db = await this.getDb();
      
      await db.write(async () => {
        for (const update of updates) {
          const query = db.get(this.tableName).query(Q.where("id", update.id));
          const results = await query;
          const model = results[0] as Recurring;
          
          if (model) {
            await model.update((recurring: any) => {
              recurring.nextoccurrencedate = update.nextDate.getTime();
              recurring.updatedat = Date.now();
            });
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to update next occurrence dates: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async incrementFailedAttempts(recurringIds: string[]): Promise<void> {
    if (recurringIds.length === 0) return;

    try {
      const db = await this.getDb();
      
      await db.write(async () => {
        for (const id of recurringIds) {
          const query = db.get(this.tableName).query(Q.where("id", id));
          const results = await query;
          const model = results[0] as Recurring;
          
          if (model) {
            await model.update((recurring: any) => {
              recurring.failedattempts = (recurring.failedattempts || 0) + 1;
              recurring.updatedat = Date.now();
            });
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to increment failed attempts: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async resetFailedAttempts(recurringIds: string[]): Promise<void> {
    if (recurringIds.length === 0) return;

    try {
      const db = await this.getDb();
      
      await db.write(async () => {
        for (const id of recurringIds) {
          const query = db.get(this.tableName).query(Q.where("id", id));
          const results = await query;
          const model = results[0] as Recurring;
          
          if (model) {
            await model.update((recurring: any) => {
              recurring.failedattempts = 0;
              recurring.updatedat = Date.now();
            });
          }
        }
      });
    } catch (error) {
      throw new Error(`Failed to reset failed attempts: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Transfer-specific methods
  async findRecurringTransfers(tenantId: string): Promise<Recurring[]> {
    return this.findByRecurringType(tenantId, RecurringTypeEnum.Transfer);
  }

  async findCreditCardPayments(tenantId: string): Promise<Recurring[]> {
    return this.findByRecurringType(tenantId, RecurringTypeEnum.CreditCardPayment);
  }

  // Auto-apply management
  async updateAutoApplyStatus(recurringId: string, enabled: boolean, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();

      const conditions = [Q.where("id", recurringId)];
      if (tenantId) {
        conditions.push(Q.where(tenantField, tenantId));
      }

      await db.write(async () => {
        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const model = results[0] as Recurring;
        
        if (model) {
          await model.update((recurring: any) => {
            recurring.autoapplyenabled = enabled;
            recurring.updatedat = Date.now();
          });
        } else {
          throw new Error("Recurring transaction not found");
        }
      });
    } catch (error) {
      throw new Error(`Failed to update auto-apply status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }


}
