import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, children } from "@nozbe/watermelondb/decorators";
import type TransactionCategory from "./TransactionCategory";
import { TableNames } from "@/src/types/db/TableNames";

export default class TransactionGroup extends Model {
  static table = TableNames.TransactionGroups;
  static associations = {
    transaction_categories: { type: "has_many", foreignKey: "groupid" },
  } as const;

  @field("name") name!: string;
  @field("type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("description") description?: string;
  @field("displayorder") displayOrder!: number;
  @field("budgetamount") budgetAmount!: number;
  @field("budgetfrequency") budgetFrequency!: string;
  @field("tenantid") tenantId!: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;

  @children(TableNames.TransactionCategories) categories!: TransactionCategory[];
}

export type TransactionGroupModel = TransactionGroup;
