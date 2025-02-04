import { ViewNames } from "@/src/types/db/TableNames";
import { StatsDailyTransactions } from "@/src/types/db/Tables.Types";
import { getDailyTransactionsSummary, getMonthlyCategoriesTransactions } from "../apis/Stats.api";
import { useQuery } from "@tanstack/react-query";

export const useGetDailyTransactionsSummary = (startDate: string, endDate: string) => {
  return useQuery<StatsDailyTransactions[]>({
    queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate],
    queryFn: async () => getDailyTransactionsSummaryHelper(startDate, endDate),
  });
};

export const useGetMonthlyCategoriesTransactions = (startDate: string, endDate: string) => {
  return useQuery<StatsDailyTransactions[]>({
    queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate],
    queryFn: async () => getMonthlyCategoriesTransactionsHelper(startDate, endDate),
  });
};

// TODO: Implement the following functions
const getDailyTransactionsSummaryHelper = async (startDate: string, endDate: string) => {
  return await getDailyTransactionsSummary(startDate, endDate);
};

// TODO: Implement the following functions
const getMonthlyCategoriesTransactionsHelper = async (startDate: string, endDate: string) => {
  return await getMonthlyCategoriesTransactions(startDate, endDate);
};
