import { useQuery } from "@tanstack/react-query";
import { ViewNames } from "@/src/types/db/TableNames";
import { StatsMonthlyAccountsTransactions, StatsMonthlyCategoriesTransactions } from "@/src/types/db/Tables.Types";
import {
  getStatsDailyTransactions,
  getStatsMonthlyAccountsTransactions,
  getStatsMonthlyCategoriesTransactions,
  getStatsMonthlyTransactionsTypes,
} from "@/src/services/apis/Stats.api";
import { BarDataType, DoubleBarPoint, MyCalendarData, PieData } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";

// TODO: One Request could be made to get all the data at once

export const useGetStatsDailyTransactions = (startDate: string, endDate: string, week = false) => {
  return useQuery<{
    barsData?: BarDataType[];
    calendarData: MyCalendarData;
  }>({
    queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate],
    queryFn: async () => getStatsDailyTransactionsHelper(startDate, endDate, week),
  });
};
const getStatsDailyTransactionsHelper = async (
  startDate: string,
  endDate: string,
  week = false,
): Promise<{
  barsData?: BarDataType[];
  calendarData: MyCalendarData;
}> => {
  const data = await getStatsDailyTransactions(startDate, endDate, "Expense");

  let barsData: BarDataType[] | undefined = undefined;
  if (week) {
    const today = dayjs().format("ddd");
    const thisWeekData = data
      .filter(
        item =>
          dayjs(item.date).local() >= dayjs().startOf("week").local() &&
          dayjs(item.date).local() <= dayjs().endOf("week").local(),
      )
      .map(item => {
        const x = dayjs(item.date).format("ddd");
        const y = Math.abs(item.sum ?? 0);
        const color = (item.sum ?? 0) > 0 ? "rgba(76, 175, 80, 0.6)" : "rgba(244, 67, 54, 0.6)";
        return { x, y, color, item };
      });
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    barsData = daysOfWeek.map(day => {
      const dayData = thisWeekData.find(x => x.x === day);
      const x = today === day ? "Today" : day;
      return {
        x,
        y: dayData?.y ?? 0,
        color: dayData?.color ?? "rgba(255, 255, 255, 0.6)",
      };
    });
  }

  const calendarData: MyCalendarData = data.reduce((acc: MyCalendarData, item) => {
    const day = dayjs(item.date).format("YYYY-MM-DD");
    const dots = acc[day]?.dots ?? [];
    const dotColor = item.type === "Income" ? "green" : item.type === "Expense" ? "red" : "teal";
    dots.push({ key: item.type!, color: dotColor });
    acc[day] = { dots };
    return acc;
  }, {});

  return { barsData, calendarData };
};

export const useGetStatsYearTransactionsTypes = (startDate: string, endDate: string) => {
  return useQuery<DoubleBarPoint[]>({
    queryKey: [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate],
    queryFn: async () => getStatsMonthlyTransactionsTypesHelper(startDate, endDate),
  });
};
const getStatsMonthlyTransactionsTypesHelper = async (
  startDate: string,
  endDate: string,
): Promise<DoubleBarPoint[]> => {
  const data = await getStatsMonthlyTransactionsTypes(startDate, endDate);

  //   [
  //    {
  //       "type": "Expense",
  //      "date": "2025-01-01",
  //      "sum": 120.5
  //    }
  //  ]

  /*
items = 
  [
    {
      x : month, 
      expensesSum : 100,
      incomeSum : 200,
    }
  ]
*/
  type Item = {
    [x: string]: {
      expensesSum: number;
      incomeSum: number;
    };
  };
  const items = data.reduce((acc: Item, item) => {
    let month = dayjs(item.date).format("MMM");
    let income = item.type === "Income" ? (item.sum ?? 0) : 0;
    let expense = item.type === "Expense" ? (item.sum ?? 0) : 0;

    let newItem = acc[month];

    if (newItem) {
      newItem.expensesSum += expense;
      newItem.incomeSum += income;
    } else {
      acc[month] = {
        expensesSum: expense,
        incomeSum: income,
      };
    }
    return acc;
  }, {});

  const barsData: DoubleBarPoint[] = Object.entries(items).map(([month, item]) => {
    return {
      x: month,
      barOne: {
        label: "Income",
        value: item.incomeSum,
        color: "rgba(76, 175, 80, 0.6)",
      },
      barTwo: {
        label: "Expense",
        value: Math.abs(item.expensesSum),
        color: "rgba(244, 67, 54, 0.6)",
      },
    };
  });

  return barsData;
};

export const useGetStatsMonthlyCategoriesTransactions = (startDate: string, endDate: string) => {
  return useQuery<StatsMonthlyCategoriesTransactions[]>({
    queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate],
    queryFn: async () => getStatsMonthlyCategoriesTransactions(startDate, endDate),
  });
};

export const useGetStatsMonthlyCategoriesTransactionsForDashboard = (startDate: string, endDate: string) => {
  return useQuery<{
    groups: (PieData & { id: string })[];
    categories: (PieData & { id: string })[];
  }>({
    queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, 'dashboard'],
    queryFn: async () => getStatsMonthlyCategoriesTransactionsDashboardHelper(startDate, endDate),
  });
};

const getStatsMonthlyCategoriesTransactionsDashboardHelper = async (
  startDate: string,
  endDate: string,
): Promise<{
  groups: (PieData & { id: string })[];
  categories: (PieData & { id: string })[];
}> => {
  const data = await getStatsMonthlyCategoriesTransactions(startDate, endDate);

  // Group data by IDs
  const groupsMap = new Map<string, { sum: number; name: string }>();
  const categoriesMap = new Map<string, { sum: number; name: string }>();

  data.forEach((item) => {
    if (item.groupid && item.sum && item.groupname) {
      const currentData = groupsMap.get(item.groupid) || { sum: 0, name: item.groupname };
      groupsMap.set(item.groupid, {
        sum: currentData.sum + Math.abs(item.sum),
        name: item.groupname
      });
    }

    if (item.categoryid && item.sum && item.groupname && item.categoryname) {
      const currentData = categoriesMap.get(item.categoryid) || { sum: 0, name: `${item.groupname}:${item.categoryname}` };
      categoriesMap.set(item.categoryid, {
        sum: currentData.sum + Math.abs(item.sum),
        name: `${item.categoryname}`
      });
    }
  });

  // Convert maps to arrays of PieData with IDs
  const groups = Array.from(groupsMap.entries()).map(([id, data]) => ({
    x: data.name,
    y: data.sum,
    id: id
  }));

  const categories = Array.from(categoriesMap.entries()).map(([id, data]) => ({
    x: data.name,
    y: data.sum,
    id: id
  }));

  return { groups, categories };
};

export const useGetStatsMonthlyAccountsTransactions = (startDate: string, endDate: string) => {
  return useQuery<StatsMonthlyAccountsTransactions[]>({
    queryKey: [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate],
    queryFn: async () => getStatsMonthlyAccountsTransactionsHelper(startDate, endDate),
  });
};

// TODO: Implement the following functions
const getStatsMonthlyAccountsTransactionsHelper = async (startDate: string, endDate: string) => {
  return await getStatsMonthlyAccountsTransactions(startDate, endDate);
};
