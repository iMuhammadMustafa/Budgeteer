import { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  useGetStatsDailyTransactions,
  useGetStatsMonthlyCategoriesTransactions,
  useGetStatsMonthlyTransactionsTypes,
} from "@/src/services/repositories/Stats.Repository";

dayjs.extend(utc);
dayjs.extend(timezone);

const today = dayjs();

const startOfCurrentMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const endOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");

const startOfCurrentYear = dayjs().startOf("year").toISOString();
const endOfCurrentYear = dayjs().endOf("year").toISOString();

export default function useDashboard() {
  const { data: dailyTransactionsThisMonth, isLoading: isWeeklyLoading } = useGetStatsDailyTransactions(
    startOfCurrentMonth,
    endOfCurrentMonth,
    true,
  );
  const { data: monthlyTransactionsGroupsAndCategories = [], isLoading: isMonthlyLoading } =
    useGetStatsMonthlyCategoriesTransactions(startOfCurrentMonth, endOfCurrentMonth);
  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } = useGetStatsMonthlyTransactionsTypes(
    startOfCurrentYear,
    endOfCurrentYear,
  );

  const weeklyTransactionTypesData = useMemo(() => {
    return dailyTransactionsThisMonth?.barsData;
  }, [dailyTransactionsThisMonth]);

  const dailyTransactionTypesData = useMemo(() => {
    return dailyTransactionsThisMonth?.calendarData;
  }, [dailyTransactionsThisMonth]);

  const monthlyCategories = useMemo(() => {
    return Array.isArray(monthlyTransactionsGroupsAndCategories)
      ? []
      : monthlyTransactionsGroupsAndCategories.categories;
  }, [monthlyTransactionsGroupsAndCategories]);
  const monthlyGroups = useMemo(() => {
    return Array.isArray(monthlyTransactionsGroupsAndCategories) ? [] : monthlyTransactionsGroupsAndCategories.groups;
  }, [monthlyTransactionsGroupsAndCategories]);

  return {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    isWeeklyLoading,
    isMonthlyLoading,
    isYearlyLoading,
  };
}
