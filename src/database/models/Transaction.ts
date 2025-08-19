import { Model } from "@nozbe/watermelondb";
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators";
import type Account from "./Account";
import type TransactionCategory from "./TransactionCategory";

export default class Transaction extends Model {
  static table = "transactions";
  static associations = {
    accounts: { type: "belongs_to", key: "AccountId" },
    transaction_categories: { type: "belongs_to", key: "CategoryId" },
    transfer_accounts: { type: "belongs_to", key: "TransferAccountId" },
  } as const;

  @field("Name") name?: string;
  @field("AccountId") accountId!: string;
  @field("CategoryId") categoryId!: string;
  @field("Amount") amount!: number;
  @field("Date") date!: string;
  @field("Description") description?: string;
  @field("Payee") payee?: string;
  @field("Notes") notes?: string;
  @field("Tags") tags?: string; // JSON string array
  @field("Type") type!: string; // Expense, Income, Transfer, Adjustment, Initial, Refund
  @field("TransferAccountId") transferAccountId?: string;
  @field("TransferId") transferId?: string;
  @field("IsVoid") isVoid!: boolean;
  @field("TenantId") tenantId!: string;
  @field("IsDeleted") isDeleted!: boolean;
  @field("CreatedBy") createdBy?: string;
  @field("UpdatedBy") updatedBy?: string;

  @readonly @date("CreatedAt") createdAt!: Date;
  @readonly @date("UpdatedAt") updatedAt!: Date;

  @relation("accounts", "AccountId") account!: Account;
  @relation("transaction_categories", "CategoryId") category!: TransactionCategory;
  @relation("accounts", "TransferAccountId") transferAccount?: Account;
}

export type TransactionModel = Transaction;
