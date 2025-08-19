import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class AccountCategory extends Model {
  static table = "account_categories";

  @field("Name") name!: string;
  @field("Type") type!: string; // Asset, Liability
  @field("Color") color!: string;
  @field("Icon") icon!: string;
  @field("DisplayOrder") displayOrder!: number;
  @field("TenantId") tenantId!: string;
  @field("IsDeleted") isDeleted!: boolean;
  @field("CreatedBy") createdBy?: string;
  @field("UpdatedBy") updatedBy?: string;

  @readonly @date("CreatedAt") createdAt!: Date;
  @readonly @date("UpdatedAt") updatedAt!: Date;
}

export type AccountCategoryModel = AccountCategory;
