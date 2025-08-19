import {
  AccountCategory as WatermelonAccountCategory,
  Account as WatermelonAccount,
  TransactionGroup as WatermelonTransactionGroup,
  TransactionCategory as WatermelonTransactionCategory,
  Transaction as WatermelonTransaction,
  Configuration as WatermelonConfiguration,
  Recurring as WatermelonRecurring,
  Profile as WatermelonProfile,
} from "../../database/models";

import {
  AccountCategory,
  Account,
  TransactionGroup,
  TransactionCategory,
  Transaction,
  Configuration,
  Recurring,
} from "../../types/db/Tables.Types";

import { Tables } from "../../types/db/database.types";

type Profile = Tables<"profiles">;

// Type mappers to convert WatermelonDB models to existing types
export const mapAccountCategoryFromWatermelon = (model: WatermelonAccountCategory): AccountCategory => {
  return {
    id: model.id,
    name: model.name,
    type: model.type as any,
    color: model.color,
    icon: model.icon,
    displayorder: model.displayOrder,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapAccountFromWatermelon = (model: WatermelonAccount): Account => {
  return {
    id: model.id,
    name: model.name,
    categoryid: model.categoryId,
    balance: model.balance,
    currency: model.currency,
    color: model.color,
    icon: model.icon,
    description: model.description || null,
    notes: model.notes || null,
    owner: model.owner || null,
    displayorder: model.displayOrder,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapTransactionGroupFromWatermelon = (model: WatermelonTransactionGroup): TransactionGroup => {
  return {
    id: model.id,
    name: model.name,
    type: model.type as any,
    color: model.color,
    icon: model.icon,
    description: model.description || null,
    displayorder: model.displayOrder,
    budgetamount: model.budgetAmount,
    budgetfrequency: model.budgetFrequency,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapTransactionCategoryFromWatermelon = (model: WatermelonTransactionCategory): TransactionCategory => {
  return {
    id: model.id,
    name: model.name || null,
    groupid: model.groupId,
    type: model.type as any,
    color: model.color,
    icon: model.icon,
    description: model.description || null,
    displayorder: model.displayOrder,
    budgetamount: model.budgetAmount,
    budgetfrequency: model.budgetFrequency,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapTransactionFromWatermelon = (model: WatermelonTransaction): Transaction => {
  return {
    id: model.id,
    name: model.name || null,
    accountid: model.accountId,
    categoryid: model.categoryId,
    amount: model.amount,
    date: model.date,
    description: model.description || null,
    payee: model.payee || null,
    notes: model.notes || null,
    tags: model.tags ? JSON.parse(model.tags) : null,
    type: model.type as any,
    transferaccountid: model.transferAccountId || null,
    transferid: model.transferId || null,
    isvoid: model.isVoid,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapConfigurationFromWatermelon = (model: WatermelonConfiguration): Configuration => {
  return {
    id: model.id,
    key: model.key,
    value: model.value,
    type: model.type,
    table: model.tableName,
    tenantid: model.tenantId || null,
    isdeleted: model.isDeleted,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapRecurringFromWatermelon = (model: WatermelonRecurring): Recurring => {
  return {
    id: model.id,
    name: model.name,
    sourceaccountid: model.sourceAccountId,
    categoryid: model.categoryId || null,
    amount: model.amount || null,
    type: model.type as any,
    description: model.description || null,
    payeename: model.payeeName || null,
    notes: model.notes || null,
    currencycode: model.currencyCode,
    recurrencerule: model.recurrenceRule,
    nextoccurrencedate: model.nextOccurrenceDate,
    enddate: model.endDate || null,
    lastexecutedat: model.lastExecutedAt || null,
    isactive: model.isActive || null,
    tenantid: model.tenantId,
    isdeleted: model.isDeleted || null,
    createdat: new Date(model.createdAt).toISOString(),
    createdby: model.createdBy || null,
    updatedat: new Date(model.updatedAt).toISOString(),
    updatedby: model.updatedBy || null,
  };
};

export const mapProfileFromWatermelon = (model: WatermelonProfile): Profile => {
  return {
    id: model.id,
    email: model.email || null,
    full_name: model.fullName || null,
    avatar_url: model.avatarUrl || null,
    timezone: model.timezone || null,
    tenantid: model.tenantId || null,
    updated_at: new Date(model.updatedAt).toISOString(),
  };
};
