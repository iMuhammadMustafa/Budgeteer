import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";
import { TableNames } from "@/src/types/db/TableNames";

export default class Recurring extends Model {
  static table = TableNames.Recurrings;
  static associations = {
    account: { type: "belongs_to", key: "sourceaccountid" },
    transaction_category: { type: "belongs_to", key: "categoryid" },
  } as const;

  @field("name") name!: string;
  @field("sourceaccountid") sourceaccountid!: string;
  @field("categoryid") categoryid?: string;
  @field("amount") amount?: number;
  @field("type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("description") description?: string;
  @field("payeename") payeename?: string;
  @field("notes") notes?: string;
  @field("currencycode") currencycode!: string;
  @field("recurrencerule") recurrencerule!: string;
  @field("nextoccurrencedate") nextoccurrencedate!: string;
  @field("enddate") enddate?: string;
  @field("lastexecutedat") lastexecutedat?: string;
  @field("isactive") isactive!: boolean;
  @field("tenantid") tenantid!: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @field("intervalmonths") intervalmonths?: number;
  @field("autoapplyenabled") autoapplyenabled?: boolean;
  @field("transferaccountid") transferaccountid?: string;
  @field("isamountflexible") isamountflexible?: boolean;
  @field("isdateflexible") isdateflexible?: boolean;
  @field("recurringtype") recurringtype?: string;
  @field("lastautoappliedat") lastautoappliedat?: string;
  @field("failedattempts") failedattempts?: number;
  @field("maxfailedattempts") maxfailedattempts?: number;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;

  @relation(TableNames.Accounts, "sourceaccountid") sourceAccount!: Account;
  @relation(TableNames.TransactionCategories, "categoryid") category?: TransactionCategory;
}

export type RecurringModel = Recurring;
