import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type TransactionGroup from "./TransactionGroup";
import { TableNames } from "@/src/types/db/TableNames";

export default class TransactionCategory extends Model {
  static table = TableNames.TransactionCategories;
  static associations = {
    group: { type: "belongs_to", key: "groupid" },
  } as const;

  @field("name") name?: string;
  @field("groupid") groupId!: string;
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

  @relation(TableNames.TransactionGroups, "groupid") group!: TransactionGroup;
}

export type TransactionCategoryModel = TransactionCategory;
