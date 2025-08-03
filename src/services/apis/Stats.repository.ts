import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/Stats.supa";
import * as Mock from "./__mock__/Stats.mock";

export const getStatsDailyTransactions = (...args: Parameters<typeof Real.getStatsDailyTransactions>) => {
  return getDemoMode() ? Mock.getStatsDailyTransactions(...args) : Real.getStatsDailyTransactions(...args);
};

export const getStatsMonthlyTransactionsTypes = (...args: Parameters<typeof Real.getStatsMonthlyTransactionsTypes>) => {
  return getDemoMode()
    ? Mock.getStatsMonthlyTransactionsTypes(...args)
    : Real.getStatsMonthlyTransactionsTypes(...args);
};

export const getStatsMonthlyCategoriesTransactions = (
  ...args: Parameters<typeof Real.getStatsMonthlyCategoriesTransactions>
) => {
  return getDemoMode()
    ? Mock.getStatsMonthlyCategoriesTransactions(...args)
    : Real.getStatsMonthlyCategoriesTransactions(...args);
};

export const getStatsMonthlyAccountsTransactions = (
  ...args: Parameters<typeof Real.getStatsMonthlyAccountsTransactions>
) => {
  return getDemoMode()
    ? Mock.getStatsMonthlyAccountsTransactions(...args)
    : Real.getStatsMonthlyAccountsTransactions(...args);
};

export const getStatsNetWorthGrowth = (...args: Parameters<typeof Real.getStatsNetWorthGrowth>) => {
  return getDemoMode() ? Mock.getStatsNetWorthGrowth(...args) : Real.getStatsNetWorthGrowth(...args);
};
