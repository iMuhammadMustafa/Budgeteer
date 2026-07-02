/**
 * Pure Stats transforms extracted from Stats.Service so they can be unit-tested
 * without the React Query / provider graph. Behavior is identical to the originals.
 */
import dayjs from "dayjs";
import { BarDataType, DoubleBarPoint, LineChartPoint, MyCalendarData, PieData } from "@/src/types/components/Charts.types";
import {
  StatsDailyTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
} from "@/src/types/database/Tables.Types";

export const getStatsDailyTransactionsHelper = (
  data: StatsDailyTransactions[],
  week = false,
  baseDate?: string,
): {
  barsData?: BarDataType[];
  calendarData: MyCalendarData;
} => {
  let barsData: BarDataType[] | undefined = undefined;
  if (week) {
    const base = baseDate ? dayjs(baseDate) : dayjs();
    const todayLabel = base.format("ddd");
    const start = base.startOf("week").local();
    const end = base.endOf("week").local();

    const thisWeekData = data
      .filter((item: any) => {
        const d = dayjs(item.date).local();
        return d >= start && d <= end;
      })
      .map((item: any) => {
        const x = dayjs(item.date).format("ddd");
        const y = Math.abs(item.sum ?? 0);
        const color = (item.sum ?? 0) > 0 ? "rgba(76, 175, 80, 0.6)" : "rgba(244, 67, 54, 0.6)";
        return { x, y, color, item };
      });

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    barsData = daysOfWeek.map(day => {
      const dayData = thisWeekData.find((x: any) => x.x === day);
      const x = todayLabel === day ? "Today" : day;
      return {
        x,
        y: dayData?.y ?? 0,
        color: dayData?.color ?? "rgba(255, 255, 255, 0.6)",
        item: dayData?.item,
      };
    });
  }

  const calendarData: MyCalendarData = data.reduce((acc: MyCalendarData, item: any) => {
    const day = dayjs(item.date).format("YYYY-MM-DD");
    const dots = acc[day]?.dots ?? [];
    const dotColor = item.type === "Income" ? "green" : item.type === "Expense" ? "red" : "teal";
    if (!dots.find((x: any) => x.key === item.type!)) {
      dots.push({ key: item.type!, color: dotColor });
    }
    acc[day] = { dots };
    return acc;
  }, {});

  return { barsData, calendarData };
};
export const getStatsMonthlyTransactionsTypesHelper = async (
  data: StatsMonthlyTransactionsTypes[],
): Promise<DoubleBarPoint[]> => {
  type Item = {
    [x: string]: {
      expensesSum: number;
      incomeSum: number;
    };
  };
  const items = data.reduce((acc: Item, item: any) => {
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
        value: (item as any).incomeSum,
        color: "rgba(76, 175, 80, 0.6)",
      },
      barTwo: {
        label: "Expense",
        value: Math.abs((item as any).expensesSum),
        color: "rgba(244, 67, 54, 0.6)",
      },
    };
  });

  return barsData;
};
export const getStatsMonthlyCategoriesTransactionsDashboardHelper = async (
  data: StatsMonthlyCategoriesTransactions[],
): Promise<{
  groups: (PieData & { id: string })[];
  categories: (PieData & { id: string })[];
}> => {
  // Group data by IDs
  const groupsMap = new Map<string, { sum: number; name: string }>();
  const categoriesMap = new Map<string, { sum: number; name: string }>();

  data.forEach((item: any) => {
    if (item.groupid && item.sum && item.groupname) {
      const currentData = groupsMap.get(item.groupid) || { sum: 0, name: item.groupname };
      groupsMap.set(item.groupid, {
        sum: currentData.sum + Math.abs(item.sum),
        name: item.groupname,
      });
    }

    if (item.categoryid && item.sum && item.groupname && item.categoryname) {
      const currentData = categoriesMap.get(item.categoryid) || {
        sum: 0,
        name: `${item.groupname}:${item.categoryname}`,
      };
      categoriesMap.set(item.categoryid, {
        sum: currentData.sum + Math.abs(item.sum),
        name: `${item.categoryname}`,
      });
    }
  });

  // Convert maps to arrays of PieData with IDs
  const groups = Array.from(groupsMap.entries()).map(([id, data]) => ({
    x: data.name,
    y: data.sum,
    id: id,
  }));

  const categories = Array.from(categoriesMap.entries()).map(([id, data]) => ({
    x: data.name,
    y: data.sum,
    id: id,
  }));

  return { groups, categories };
};
export const getStatsNetWorthGrowthHelper = async (data: StatsNetWorthGrowth[]): Promise<LineChartPoint[]> => {
  return data.map((item: any) => ({
    x: dayjs(item.month).format("MMM"),
    y: item.total_net_worth ?? 0,
  }));
};
