import { EnumNames, TableNames } from "@/src/types/database/TableNames";
import { Model } from "@nozbe/watermelondb";
import { children, date, field } from "@nozbe/watermelondb/decorators";
import { Enums, Tables } from "../../Tables.Types";
import type TransactionCategory from "./TransactionCategory";

export default class TransactionGroup extends Model implements Tables<TableNames.TransactionGroups> {
  static table = TableNames.TransactionGroups;
  static associations = {
    transaction_categories: { type: "has_many", foreignKey: "groupid" },
  } as const;

  @field("name") name!: string;
  @field("type") type!: Enums<EnumNames.TransactionTypes>;
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("description") description!: string | null;
  @field("displayorder") displayorder!: number;
  @field("budgetamount") budgetamount!: number;
  @field("budgetfrequency") budgetfrequency!: string;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;

  @date("createdat") createdat!: string;
  @date("updatedat") updatedat!: string | null;

  @children(TableNames.TransactionCategories) categories!: TransactionCategory[];
}

export type TransactionGroupModel = TransactionGroup;
