import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type TransactionGroup from "./TransactionGroup";

export default class TransactionCategory extends Model {
  static table = "transaction_categories";
  static associations = {
    transaction_groups: { type: "belongs_to", key: "GroupId" },
  } as const;

  @field("Name") name?: string;
  @field("GroupId") groupId!: string;
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

  @relation("transaction_groups", "GroupId") group!: TransactionGroup;
}

export type TransactionCategoryModel = TransactionCategory;
