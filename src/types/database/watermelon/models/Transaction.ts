import { EnumNames, TableNames } from "@/src/types/database/TableNames";
import { Enums, Tables } from "@/src/types/database/Tables.Types";
import { Model } from "@nozbe/watermelondb";
import { date, field, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";

export default class Transaction extends Model implements Tables<TableNames.Transactions> {
  static table = TableNames.Transactions;
  static associations = {
    account: { type: "belongs_to", key: "accountid" },
    category: { type: "belongs_to", key: "categoryid" },
    transferAccount: { type: "belongs_to", key: "transferaccountid" },
  } as const;

  @field("name") name!: string | null;
  @field("amount") amount!: number;
  @field("date") date!: string;
  @field("description") description!: string | null;
  @field("payee") payee!: string | null;
  @field("notes") notes!: string | null;
  @field("tags") tags!: string[] | null;
  @field("type") type!: Enums<EnumNames.TransactionTypes>;
  @field("isvoid") isvoid!: boolean;

  @field("accountid") accountid!: string;
  @field("categoryid") categoryid!: string;
  @field("transferaccountid") transferaccountid!: string | null;
  @field("transferid") transferid!: string | null;

  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;
  @date("createdat") createdat!: string;
  @date("updatedat") updatedat!: string | null;

  @relation(TableNames.Accounts, "accountid") account!: Account;
  @relation(TableNames.TransactionCategories, "categoryid") category!: TransactionCategory;
  @relation(TableNames.Accounts, "transferaccountid") transferAccount?: Account;
}

export type TransactionModel = Transaction;
