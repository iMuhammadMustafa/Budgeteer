import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type AccountCategory from "./AccountCategory";
import { TableNames } from "@/src/types/db/TableNames";

export default class Account extends Model {
  static table = TableNames.Accounts;
  static associations = {
    category: { type: "belongs_to", key: "categoryid" },
  } as const;

  @field("name") name!: string;
  @field("categoryid") categoryId!: string;
  @field("balance") balance!: number;
  @field("currency") currency!: string;
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("description") description?: string;
  @field("notes") notes?: string;
  @field("owner") owner?: string;
  @field("displayorder") displayOrder!: number;
  @field("tenantid") tenantId!: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;

  @relation(TableNames.AccountCategories, "categoryid") category!: AccountCategory;
}

export type AccountModel = Account;
