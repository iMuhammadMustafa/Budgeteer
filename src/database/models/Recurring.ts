import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";

export default class Recurring extends Model {
  static table = "recurrings";
  static associations = {
    accounts: { type: "belongs_to", key: "sourceaccountid" },
    transaction_categories: { type: "belongs_to", key: "categoryid" },
  } as const;

  @field("name") name!: string;
  @field("sourceaccountid") sourceAccountId!: string;
  @field("categoryid") categoryId?: string;
  @field("amount") amount?: number;
  @field("Type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("description") description?: string;
  @field("payeename") payeeName?: string;
  @field("notes") notes?: string;
  @field("currencycode") currencyCode!: string;
  @field("recurrencerule") recurrenceRule!: string;
  @field("nextoccurrencedate") nextOccurrenceDate!: string;
  @field("enddate") endDate?: string;
  @field("lastexecutedat") lastExecutedAt?: string;
  @field("isactive") isActive!: boolean;
  @field("tenantid") tenantId!: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;

  @relation("accounts", "sourceaccountid") sourceAccount!: Account;
  @relation("transaction_categories", "categoryid") category?: TransactionCategory;
}

export type RecurringModel = Recurring;
