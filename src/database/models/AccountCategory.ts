import { TableNames } from "@/src/types/db/TableNames";
import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class AccountCategory extends Model {
  static table = TableNames.AccountCategories;

  @field("name") name!: string;
  @field("type") type!: string; // Asset, Liability
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("displayorder") displayorder!: number;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;
}

export type AccountCategoryModel = AccountCategory;
