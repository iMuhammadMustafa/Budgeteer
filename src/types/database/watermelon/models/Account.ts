import { TableNames } from "@/src/types/database/TableNames";
import { Tables } from "@/src/types/database/Tables.Types";
import { Model } from "@nozbe/watermelondb";
import { date, field, relation } from "@nozbe/watermelondb/decorators";
import type AccountCategory from "./AccountCategory";

export default class Account extends Model implements Tables<TableNames.Accounts> {
  static table = TableNames.Accounts;
  static associations = {
    category: { type: "belongs_to", key: "categoryid" },
  } as const;

  @field("name") name!: string;
  @field("balance") balance!: number;
  @field("currency") currency!: string;
  @field("color") color!: string;
  @field("icon") icon!: string;
  @field("description") description!: string | null;
  @field("notes") notes!: string | null;
  @field("owner") owner!: string | null;
  @field("displayorder") displayorder!: number;

  @field("categoryid") categoryid!: string;

  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;
  @date("createdat") createdat!: string;
  @date("updatedat") updatedat!: string | null;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;

  @relation(TableNames.AccountCategories, "categoryid") category!: AccountCategory;
}

export type AccountModel = Account;
