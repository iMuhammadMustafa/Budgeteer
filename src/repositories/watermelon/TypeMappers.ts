import {
  Account as WatermelonAccount,
  AccountCategory as WatermelonAccountCategory,
  Configuration as WatermelonConfiguration,
  Profile as WatermelonProfile,
  Recurring as WatermelonRecurring,
  Transaction as WatermelonTransaction,
  TransactionCategory as WatermelonTransactionCategory,
  TransactionGroup as WatermelonTransactionGroup,
} from "@/src/types/database/watermelon/models";

import {
  Account,
  AccountCategory,
  Configuration,
  Recurring,
  Tables,
  Transaction,
  TransactionCategory,
  TransactionGroup,
} from "@/src/types/database/Tables.Types";

type Profile = Tables<"profiles">;

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
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,
  };
};

export const mapAccountFromWatermelon = (
  model: WatermelonAccount & { runningbalance?: number | null | undefined; category?: WatermelonAccountCategory },
  category?: WatermelonAccountCategory,
): Account => {
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
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,
    statementdate: model.statementdate || null,
    category: category ? mapAccountCategoryFromWatermelon(category) : undefined,
    runningbalance:
      model.runningbalance !== undefined && model.runningbalance !== null ? Number(model.runningbalance) : undefined,
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
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,
  };
};

export const mapTransactionCategoryFromWatermelon = (
  model: WatermelonTransactionCategory & { group?: WatermelonTransactionGroup },
  group?: WatermelonTransactionGroup,
): TransactionCategory => {
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
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,

    group: group ? mapTransactionGroupFromWatermelon(group) : undefined,
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
    tags: model.tags,
    type: model.type as any,
    transferaccountid: model.transferaccountid || null,
    transferid: model.transferid || null,
    isvoid: model.isvoid,
    tenantid: model.tenantid,
    isdeleted: model.isdeleted,
    createdat: new Date(model.createdat).toISOString(),
    createdby: model.createdby || null,
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
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
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,
  };
};

export const mapRecurringFromWatermelon = (model: WatermelonRecurring): Recurring => {
  return {
    id: model.id,
    name: model.name,
    sourceaccountid: model.sourceaccountid,
    categoryid: model.categoryid || "",
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
    createdat: model.createdat ? new Date(model.createdat).toISOString() : null,
    createdby: model.createdby || null,
    updatedat: model.updatedat ? new Date(model.updatedat).toISOString() : null,
    updatedby: model.updatedby || null,
    autoapplyenabled: model.autoapplyenabled,

    failedattempts: model.failedattempts,
    intervalmonths: model.intervalmonths,
    isamountflexible: model.isamountflexible,
    lastautoappliedat: model.lastautoappliedat,
    isdateflexible: model.isdateflexible,

    maxfailedattempts: model.maxfailedattempts,
    recurringtype: model.recurringtype,
    transferaccountid: model.transferaccountid,
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
