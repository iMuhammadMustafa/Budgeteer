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
  @field("accountid") accountId!: string;
  @field("categoryid") categoryId!: string;
  @field("amount") amount!: number;
  @field("date") date!: string;
  @field("description") description?: string;
  @field("payee") payee?: string;
  @field("notes") notes?: string;
  @field("tags") tags?: string; // JSON string array
  @field("type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("transferaccountid") transferAccountId?: string;
  @field("transferid") transferId?: string;
  @field("isvoid") isVoid!: boolean;
  @field("tenantid") tenantId!: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;

  @relation(TableNames.Accounts, "accountid") account!: Account;
  @relation(TableNames.TransactionCategories, "categoryid") category!: TransactionCategory;
  @relation(TableNames.Accounts, "transferaccountid") transferAccount?: Account;
}

export type TransactionModel = Transaction;
