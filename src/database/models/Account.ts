import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type AccountCategory from "./AccountCategory";

export default class Account extends Model {
  static table = "accounts";
  static associations = {
    account_categories: { type: "belongs_to", key: "CategoryId" },
  } as const;

  @field("Name") name!: string;
  @field("CategoryId") categoryId!: string;
  @field("Balance") balance!: number;
  @field("Currency") currency!: string;
  @field("Color") color!: string;
  @field("Icon") icon!: string;
  @field("Description") description?: string;
  @field("Notes") notes?: string;
  @field("Owner") owner?: string;
  @field("DisplayOrder") displayOrder!: number;
  @field("TenantId") tenantId!: string;
  @field("IsDeleted") isDeleted!: boolean;
  @field("CreatedBy") createdBy?: string;
  @field("UpdatedBy") updatedBy?: string;

  @readonly @date("CreatedAt") createdAt!: Date;
  @readonly @date("UpdatedAt") updatedAt!: Date;

  @relation("account_categories", "CategoryId") category!: AccountCategory;
}

export type AccountModel = Account;
