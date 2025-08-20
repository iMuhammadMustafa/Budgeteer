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
  @field("displayorder") displayorder!: number;
  @field("budgetamount") budgetamount!: number;
  @field("budgetfrequency") budgetfrequency!: string;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;

  @children(TableNames.TransactionCategories) categories!: TransactionCategory[];
}

export type TransactionGroupModel = TransactionGroup;
