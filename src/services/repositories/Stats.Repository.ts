import { useQuery } from "@tanstack/react-query";
import { ViewNames } from "@/src/types/db/TableNames";
import { StatsMonthlyAccountsTransactions } from "@/src/types/db/Tables.Types";
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
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
    return {
      x: day,
      y: 0,
    };
  });
  const today = dayjs();
  const data = await getStatsDailyTransactions(startDate, endDate, "Expense");

  let barsData: BarDataType[] | undefined = undefined;
  if (week) {
    barsData = [
      ...daysOfWeek,
      ...(data
        .filter(
          x =>
            dayjs(x.date).local() >= dayjs().startOf("week").local() &&
            dayjs(x.date).local() <= dayjs().endOf("week").local(),
        )
        .map(item => {
          const x = dayjs(item.date).isSame(today, "date") ? "Today" : dayjs(item.date).format("ddd");
          const y = Math.abs(item.sum ?? 0);
          const color = (item.sum ?? 0) > 0 ? "rgba(255, 0, 0, 0.6)" : "rgba(0, 255, 0, 0.6)";
          return { x, y, color, item };
        }) || []),
    ];
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
  return useQuery<{
    groups: PieData[];
    categories: PieData[];
  }>({
    queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate],
    queryFn: async () => getStatsMonthlyCategoriesTransactionsHelper(startDate, endDate),
  });
};
const getStatsMonthlyCategoriesTransactionsHelper = async (
  startDate: string,
  endDate: string,
): Promise<{
  groups: PieData[];
  categories: PieData[];
}> => {
  const data = await getStatsMonthlyCategoriesTransactions(startDate, endDate);

  const groupMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();

  data.forEach(item => {
    const group = item.groupname ?? "Unknown";
    const category = item.categoryname ?? "Unknown";
    const groupSum = groupMap.get(group) ?? 0;
    const categorySum = categoryMap.get(category) ?? 0;
    groupMap.set(group, groupSum + Math.abs(item.sum ?? 0));
    categoryMap.set(category, categorySum + Math.abs(item.sum ?? 0));
  });

  const groups: PieData[] = Array.from(groupMap.entries()).map(([x, y]) => {
    return {
      x,
      y,
    };
  });

  const categories: PieData[] = Array.from(categoryMap.entries()).map(([x, y]) => {
    return {
      x,
      y,
    };
  });

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
