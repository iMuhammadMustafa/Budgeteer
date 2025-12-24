import { EnumNames, TableNames } from "@/src/types/database/TableNames";
import { Enums, Tables } from "@/src/types/database/Tables.Types";
import { Model } from "@nozbe/watermelondb";
import { date, field, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";

export default class Recurring extends Model implements Tables<TableNames.Recurrings> {
  @field("amount") amount!: number | null;
  @field("autoapplyenabled") autoapplyenabled!: boolean | null;
  @field("currencycode") currencycode!: string;
  @field("description") description!: string | null;
  @field("enddate") enddate!: string | null;
  @field("failedattempts") failedattempts!: number | null;
  @field("intervalmonths") intervalmonths!: number | null;
  @field("isactive") isactive!: boolean | null;
  @field("isamountflexible") isamountflexible!: boolean | null;
  @field("isdateflexible") isdateflexible!: boolean | null;
  @field("lastautoappliedat") lastautoappliedat!: string | null;
  @field("lastexecutedat") lastexecutedat!: string | null;
  @field("maxfailedattempts") maxfailedattempts!: number | null;
  @field("name") name!: string;
  @field("nextoccurrencedate") nextoccurrencedate!: string | null;
  @field("notes") notes!: string | null;
  @field("payeename") payeename!: string | null;
  @field("recurrencerule") recurrencerule!: string;
  @field("recurringtype") recurringtype!: Enums<EnumNames.RecurringTypes> | null;
  @field("type") type!: Enums<EnumNames.TransactionTypes>;

  @field("categoryid") categoryid!: string;
  @field("sourceaccountid") sourceaccountid!: string;
  @field("transferaccountid") transferaccountid!: string | null;

  @date("createdat") createdat!: string | null;
  @date("updatedat") updatedat!: string | null;
  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;
  @field("isdeleted") isdeleted!: boolean | null;
  @field("tenantid") tenantid!: string;

  static table = TableNames.Recurrings;
  static associations = {
    account: { type: "belongs_to", key: "sourceaccountid" },
    transaction_category: { type: "belongs_to", key: "categoryid" },
  } as const;

  @relation(TableNames.Accounts, "sourceaccountid") sourceAccount!: Account;
  @relation(TableNames.TransactionCategories, "categoryid") category!: TransactionCategory;
}

export type RecurringModel = Recurring;
