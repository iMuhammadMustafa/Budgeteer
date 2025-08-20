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
  @field("groupid") groupid!: string;
  @field("type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("description") description?: string;
  @field("displayorder") displayorder!: number;
  @field("budgetamount") budgetamount!: number;
  @field("budgetfrequency") budgetfrequency!: string;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;

  @relation(TableNames.TransactionGroups, "groupid") group!: TransactionGroup;
}

export type TransactionCategoryModel = TransactionCategory;
