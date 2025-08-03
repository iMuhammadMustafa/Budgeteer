// Mock implementation for Stats API

export const getStatsDailyTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
  type?: string,
) => {
  // TODO: Return mock daily transactions
  return [{ date: startDate ?? "2025-08-01", sum: 100, type: type ?? "Expense", tenantid: tenantId }];
};

export const getStatsMonthlyTransactionsTypes = async (tenantId: string, startDate?: string, endDate?: string) => {
  // TODO: Return mock monthly transaction types
  return [{ date: startDate ?? "2025-08-01", type: "Expense", sum: 100, tenantid: tenantId }];
};

export const getStatsMonthlyCategoriesTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  // TODO: Return mock monthly categories transactions
  return [
    {
      groupid: "mockGroup",
      categoryid: "mockCategory",
      groupname: "Mock Group",
      categoryname: "Mock Category",
      sum: 100,
      type: "Expense",
      groupicon: "icon",
      categoryicon: "icon",
      groupbudgetamount: 200,
      categorybudgetamount: 100,
      date: startDate ?? "2025-08-01",
      categorybudgetfrequency: "Monthly",
      categorycolor: "#000",
      categorydisplayorder: 1,
      groupbudgetfrequency: "Monthly",
      groupcolor: "#111",
      groupdisplayorder: 1,
      tenantid: tenantId,
    },
  ];
};

export const getStatsMonthlyAccountsTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  // TODO: Return mock monthly accounts transactions
  return [{ accountid: "mockAccount", sum: 100, date: startDate ?? "2025-08-01", tenantid: tenantId }];
};

export const getStatsNetWorthGrowth = async (tenantId: string, startDate?: string, endDate?: string) => {
  // TODO: Return mock net worth growth
  return [{ month: startDate ?? "2025-01-01", networth: 1000, tenantid: tenantId }];
};
