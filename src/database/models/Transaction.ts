import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";
import { TableNames } from "@/src/types/db/TableNames";

export default class Transaction extends Model {
  static table = TableNames.Transactions;
  static associations = {
    account: { type: "belongs_to", key: "accountid" },
    category: { type: "belongs_to", key: "categoryid" },
    transferAccount: { type: "belongs_to", key: "transferaccountid" },
  } as const;

  @field("name") name?: string;
  @field("accountid") accountid!: string;
  @field("categoryid") categoryid!: string;
  @field("amount") amount!: number;
  @field("date") date!: string;
  @field("description") description?: string;
  @field("payee") payee?: string;
  @field("notes") notes?: string;
  @field("tags") tags?: string; // JSON string array
  @field("type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("transferaccountid") transferaccountid?: string;
  @field("transferid") transferid?: string;
  @field("isvoid") isvoid!: boolean;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;

  @relation(TableNames.Accounts, "accountid") account!: Account;
  @relation(TableNames.TransactionCategories, "categoryid") category!: TransactionCategory;
  @relation(TableNames.Accounts, "transferaccountid") transferAccount?: Account;
}

export type TransactionModel = Transaction;
