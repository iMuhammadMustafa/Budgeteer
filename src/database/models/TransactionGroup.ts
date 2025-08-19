import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, children } from "@nozbe/watermelondb/decorators";
import type TransactionCategory from "./TransactionCategory";

export default class TransactionGroup extends Model {
  static table = "transaction_groups";
  static associations = {
    transaction_categories: { type: "has_many", foreignKey: "GroupId" },
  } as const;

  @field("Name") name!: string;
  @field("Type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("Color") color!: string;
  @field("Icon") icon!: string;
  @field("Description") description?: string;
  @field("DisplayOrder") displayOrder!: number;
  @field("BudgetAmount") budgetAmount!: number;
  @field("BudgetFrequency") budgetFrequency!: string;
  @field("TenantId") tenantId!: string;
  @field("IsDeleted") isDeleted!: boolean;
  @field("CreatedBy") createdBy?: string;
  @field("UpdatedBy") updatedBy?: string;

  @readonly @date("CreatedAt") createdAt!: Date;
  @readonly @date("UpdatedAt") updatedAt!: Date;

  @children("transaction_categories") categories!: TransactionCategory[];
}

export type TransactionGroupModel = TransactionGroup;
