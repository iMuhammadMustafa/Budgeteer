import { EnumNames, TableNames } from "@/src/types/database/TableNames";
import { Enums, Tables } from "@/src/types/database/Tables.Types";
import { Model } from "@nozbe/watermelondb";
import { date, field } from "@nozbe/watermelondb/decorators";

export default class AccountCategory extends Model implements Tables<TableNames.AccountCategories> {
  static table = TableNames.AccountCategories;

  @field("name") name!: string;
  @field("type") type!: Enums<EnumNames.AccountTypes>; // Asset, Liability
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("displayorder") displayorder!: number;
  @field("statementdate") statementdate!: number | null;

  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;

  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;
  @date("createdat") createdat!: string;
  @date("updatedat") updatedat!: string | null;
}

export type AccountCategoryModel = AccountCategory;
