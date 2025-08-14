import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/Stats.supa";
import * as Mock from "./__mock__/Stats.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getStatsDailyTransactions = (...args: Parameters<typeof Real.getStatsDailyTransactions>) => {
  try {
    const repository = repositoryManager.getStatsRepository();
    return repository.getStatsDailyTransactions(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getStatsDailyTransactions(...args) : Real.getStatsDailyTransactions(...args);
  }
};

export const getStatsMonthlyTransactionsTypes = (...args: Parameters<typeof Real.getStatsMonthlyTransactionsTypes>) => {
  try {
    const repository = repositoryManager.getStatsRepository();
    return repository.getStatsMonthlyTransactionsTypes(...args);
  } catch (error) {
    return getDemoMode()
      ? Mock.getStatsMonthlyTransactionsTypes(...args)
      : Real.getStatsMonthlyTransactionsTypes(...args);
  }
};

export const getStatsMonthlyCategoriesTransactions = (
  ...args: Parameters<typeof Real.getStatsMonthlyCategoriesTransactions>
) => {
  try {
    const repository = repositoryManager.getStatsRepository();
    return repository.getStatsMonthlyCategoriesTransactions(...args);
  } catch (error) {
    return getDemoMode()
      ? Mock.getStatsMonthlyCategoriesTransactions(...args)
      : Real.getStatsMonthlyCategoriesTransactions(...args);
  }
};

export const getStatsMonthlyAccountsTransactions = (
  ...args: Parameters<typeof Real.getStatsMonthlyAccountsTransactions>
) => {
  try {
    const repository = repositoryManager.getStatsRepository();
    return repository.getStatsMonthlyAccountsTransactions(...args);
  } catch (error) {
    return getDemoMode()
      ? Mock.getStatsMonthlyAccountsTransactions(...args)
      : Real.getStatsMonthlyAccountsTransactions(...args);
  }
};

export const getStatsNetWorthGrowth = (...args: Parameters<typeof Real.getStatsNetWorthGrowth>) => {
  try {
    const repository = repositoryManager.getStatsRepository();
    return repository.getStatsNetWorthGrowth(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getStatsNetWorthGrowth(...args) : Real.getStatsNetWorthGrowth(...args);
  }
};
