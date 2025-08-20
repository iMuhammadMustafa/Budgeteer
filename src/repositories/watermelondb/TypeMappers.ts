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
    displayorder: model.displayorder,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
  };
};

export const mapAccountFromWatermelon = (model: WatermelonAccount): Account => {
  return {
    id: model.id,
    name: model.name,
    categoryid: model.categoryid,
    balance: model.balance,
    currency: model.currency,
    color: model.color,
    icon: model.icon,
    description: model.description || null,
    notes: model.notes || null,
    owner: model.owner || null,
    displayorder: model.displayorder,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
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
    displayorder: model.displayorder,
    budgetamount: model.budgetamount,
    budgetfrequency: model.budgetfrequency,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
  };
};

export const mapTransactionCategoryFromWatermelon = (model: WatermelonTransactionCategory): TransactionCategory => {
  return {
    id: model.id,
    name: model.name || null,
    groupid: model.groupid,
    type: model.type as any,
    color: model.color,
    icon: model.icon,
    description: model.description || null,
    displayorder: model.displayorder,
    budgetamount: model.budgetamount,
    budgetfrequency: model.budgetfrequency,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
  };
};

export const mapTransactionFromWatermelon = (model: WatermelonTransaction): Transaction => {
  return {
    id: model.id,
    name: model.name || null,
    accountid: model.accountid,
    categoryid: model.categoryid,
    amount: model.amount,
    date: model.date,
    description: model.description || null,
    payee: model.payee || null,
    notes: model.notes || null,
    tags: model.tags ? JSON.parse(model.tags) : null,
    type: model.type as any,
    transferaccountid: model.transferaccountid || null,
    transferid: model.transferid || null,
    isvoid: model.isvoid,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
  };
};

export const mapConfigurationFromWatermelon = (model: WatermelonConfiguration): Configuration => {
  return {
    id: model.id,
    key: model.key,
    value: model.value,
    type: model.type,
    table: model.tablename,
    tenantid: model.tenantid || null,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
  };
};

export const mapRecurringFromWatermelon = (model: WatermelonRecurring): Recurring => {
  return {
    id: model.id,
    name: model.name,
    sourceaccountid: model.sourceaccountid,
    categoryid: model.categoryid || null,
    amount: model.amount || null,
    type: model.type as any,
    description: model.description || null,
    payeename: model.payeename || null,
    notes: model.notes || null,
    currencycode: model.currencycode,
    recurrencerule: model.recurrencerule,
    nextoccurrencedate: model.nextoccurrencedate,
    enddate: model.enddate || null,
    lastexecutedat: model.lastexecutedat || null,
    isactive: model.isactive || null,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted || null,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: new Date(model.updatedat).toISOString(),
    updatedby: model.updatedby || null,
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
