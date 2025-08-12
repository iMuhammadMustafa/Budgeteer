// Mock implementation for Stats API

import { StatsMonthlyCategoriesTransactions, TransactionType } from "@/src/types/db/Tables.Types";
import { transactions, transactionCategories, transactionGroups, accounts } from "./mockDataStore";

export const getStatsDailyTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
) => {
  // Default to current week if no dates provided
  const defaultStartDate = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date().toISOString().split('T')[0];
  const filterType = type || "Expense";

  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      !tr.isdeleted &&
      tr.type === filterType &&
      tr.date >= defaultStartDate &&
      tr.date <= defaultEndDate
  );

  const grouped: { [date: string]: number } = {};
  filtered.forEach(tr => {
    const date = tr.date.split("T")[0];
    grouped[date] = (grouped[date] || 0) + tr.amount;
  });

  return Object.entries(grouped).map(([date, sum]) => ({
    date,
    sum,
    type: filterType,
    tenantid: tenantId,
  }));
};

export const getStatsMonthlyTransactionsTypes = async (tenantId: string, startDate?: string, endDate?: string) => {
  // Default to current week if no dates provided
  const defaultStartDate = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      !tr.isdeleted &&
      tr.date >= defaultStartDate &&
      tr.date <= defaultEndDate
  );

  const grouped: { [type: string]: number } = {};
  filtered.forEach(tr => {
    grouped[tr.type] = (grouped[tr.type] || 0) + tr.amount;
  });

  return Object.entries(grouped).map(([type, sum]) => ({
    date: defaultStartDate,
    type,
    sum,
    tenantid: tenantId,
  }));
};

export const getStatsMonthlyCategoriesTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<StatsMonthlyCategoriesTransactions[]> => {
  // Default to current month if no dates provided
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      !tr.isdeleted &&
      (tr.type === "Expense" || tr.type === "Adjustment") &&
      tr.date >= defaultStartDate &&
      tr.date <= defaultEndDate
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
      type: cat?.type ?? "Expense",
      groupicon: group?.icon ?? "",
      categoryicon: cat?.icon ?? "",
      groupbudgetamount: group?.budgetamount ?? 0,
      categorybudgetamount: cat?.budgetamount ?? 0,
      date: defaultStartDate,
      categorybudgetfrequency: cat?.budgetfrequency ?? "Monthly",
      categorycolor: cat?.color ?? "#4CAF50",
      categorydisplayorder: cat?.displayorder ?? 0,
      groupbudgetfrequency: group?.budgetfrequency ?? "Monthly",
      groupcolor: group?.color ?? "#4CAF50",
      groupdisplayorder: group?.displayorder ?? 0,
      tenantid: tenantId,
    };
  });
};

export const getStatsMonthlyAccountsTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  // Default to current month if no dates provided
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const filtered = transactions.filter(
    tr =>
      (tr.tenantid === tenantId || tenantId === "demo") &&
      !tr.isdeleted &&
      tr.date >= defaultStartDate &&
      tr.date <= defaultEndDate
  );

  const grouped: { [accId: string]: number } = {};
  filtered.forEach(tr => {
    grouped[tr.accountid] = (grouped[tr.accountid] || 0) + tr.amount;
  });

  return Object.entries(grouped).map(([accountid, sum]) => {
    const account = accounts.find(acc => acc.id === accountid);
    return {
      accountid,
      account: account?.name ?? "Unknown Account",
      sum,
      date: defaultStartDate,
      tenantid: tenantId,
    };
  });
};

export const getStatsNetWorthGrowth = async (tenantId: string, startDate?: string, endDate?: string) => {
  // Default to current year if no dates provided
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];

  const filtered = accounts.filter(acc => 
    (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted
  );
  
  const total = filtered.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Generate monthly data points (simplified - in real implementation would calculate historical balances)
  const months = [];
  const start = new Date(defaultStartDate);
  const end = new Date(defaultEndDate);
  
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    months.push({
      month: d.toISOString().split('T')[0],
      networth: total, // Simplified - would calculate actual historical net worth
      tenantid: tenantId,
    });
  }
  
  return months.sort((a, b) => a.month.localeCompare(b.month));
};
