import { EnumNames, TableNames } from "@/src/types/database/TableNames";
import { Model } from "@nozbe/watermelondb";
import { date, field, relation } from "@nozbe/watermelondb/decorators";
import { Enums, Tables } from "../../Tables.Types";
import type TransactionGroup from "./TransactionGroup";

export default class TransactionCategory extends Model implements Tables<TableNames.TransactionCategories> {
  static table = TableNames.TransactionCategories;
  static associations = {
    group: { type: "belongs_to", key: "groupid" },
  } as const;

  @field("name") name!: string;
  @field("groupid") groupid!: string;
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

  @relation(TableNames.TransactionGroups, "groupid") group!: TransactionGroup;
}

export type TransactionCategoryModel = TransactionCategory;
