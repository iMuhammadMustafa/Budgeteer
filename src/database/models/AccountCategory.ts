import { TableNames } from "@/src/types/db/TableNames";
import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class AccountCategory extends Model {
  static table = TableNames.AccountCategories;

  @field("name") name!: string;
  @field("type") type!: string; // Asset, Liability
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("displayorder") displayOrder!: number;
  @field("tenantid") tenantId!: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;
}

export type AccountCategoryModel = AccountCategory;
