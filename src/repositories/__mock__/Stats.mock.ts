// Mock implementation for Stats API

import { transactions, transactionCategories, transactionGroups, accounts } from "./mockDataStore";

export const getStatsDailyTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
  type?: string,
) => {
  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      (!type || tr.type === type) &&
      (!startDate || tr.date >= startDate) &&
      (!endDate || tr.date <= endDate),
  );
  const grouped: { [date: string]: number } = {};
  filtered.forEach(tr => {
    const date = tr.date.split("T")[0];
    grouped[date] = (grouped[date] || 0) + tr.amount;
  });
  return Object.entries(grouped).map(([date, sum]) => ({
    date,
    sum,
    type: type ?? "All",
    tenantid: tenantId,
  }));
};

export const getStatsMonthlyTransactionsTypes = async (tenantId: string, startDate?: string, endDate?: string) => {
  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      (!startDate || tr.date >= startDate) &&
      (!endDate || tr.date <= endDate),
  );
  const grouped: { [type: string]: number } = {};
  filtered.forEach(tr => {
    grouped[tr.type] = (grouped[tr.type] || 0) + tr.amount;
  });
  return Object.entries(grouped).map(([type, sum]) => ({
    date: startDate ?? new Date().toISOString().split("T")[0],
    type,
    sum,
    tenantid: tenantId,
  }));
};

export const getStatsMonthlyCategoriesTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      (!startDate || tr.date >= startDate) &&
      (!endDate || tr.date <= endDate),
  );
  const grouped: { [catId: string]: number } = {};
  filtered.forEach(tr => {
    grouped[tr.categoryid] = (grouped[tr.categoryid] || 0) + tr.amount;
  });
  return Object.entries(grouped).map(([categoryid, sum]) => {
    const cat = transactionCategories.find(c => c.id === categoryid);
    const group = cat ? transactionGroups.find(g => g.id === cat.groupid) : undefined;
    return {
      groupid: group?.id ?? "unknown",
      categoryid,
      groupname: group?.name ?? "Unknown",
      categoryname: cat?.name ?? "Unknown",
      sum,
      type: cat?.type ?? "Unknown",
      groupicon: group?.icon ?? "",
      categoryicon: cat?.icon ?? "",
      groupbudgetamount: group?.budgetamount ?? 0,
      categorybudgetamount: cat?.budgetamount ?? 0,
      date: startDate ?? new Date().toISOString().split("T")[0],
      categorybudgetfrequency: cat?.budgetfrequency ?? "",
      categorycolor: cat?.color ?? "",
      categorydisplayorder: cat?.displayorder ?? 0,
      groupbudgetfrequency: group?.budgetfrequency ?? "",
      groupcolor: group?.color ?? "",
      groupdisplayorder: group?.displayorder ?? 0,
      tenantid: tenantId,
    };
  });
};

export const getStatsMonthlyAccountsTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      (!startDate || tr.date >= startDate) &&
      (!endDate || tr.date <= endDate),
  );
  const grouped: { [accId: string]: number } = {};
  filtered.forEach(tr => {
    grouped[tr.accountid] = (grouped[tr.accountid] || 0) + tr.amount;
  });
  return Object.entries(grouped).map(([accountid, sum]) => ({
    accountid,
    sum,
    date: startDate ?? new Date().toISOString().split("T")[0],
    tenantid: tenantId,
  }));
};

export const getStatsNetWorthGrowth = async (tenantId: string, startDate?: string, endDate?: string) => {
  const filtered = accounts.filter(acc => acc.tenantid === tenantId || tenantId === "demo");
  const total = filtered.reduce((sum, acc) => sum + (acc.isdeleted ? 0 : acc.balance), 0);
  return [
    {
      month: startDate ?? new Date().toISOString().split("T")[0],
      networth: total,
      tenantid: tenantId,
    },
  ];
};
