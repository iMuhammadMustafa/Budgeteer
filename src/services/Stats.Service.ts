import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
import { ViewNames } from "@/src/types/database/TableNames";
import {
  StatsDailyTransactions,
  StatsMonthlyAccountsTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/database/Tables.Types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

export interface IStatsService {
  useGetStatsDailyTransactions: (
    startDate: string,
    endDate: string,
    week?: boolean,
    type?: TransactionType,
  ) => ReturnType<
    typeof useQuery<{
      barsData?: BarDataType[];
      calendarData: MyCalendarData;
    }>
  >;
  useGetStatsDailyTransactionsRaw: (
    startDate: string,
    endDate: string,
    type?: TransactionType,
  ) => ReturnType<typeof useQuery<StatsDailyTransactions[]>>;
  useGetStatsMonthlyTransactionsTypes: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<DoubleBarPoint[]>>;
  useGetStatsMonthlyCategoriesTransactions: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<
    typeof useQuery<{
      groups: (PieData & { id: string })[];
      categories: (PieData & { id: string })[];
    }>
  >;
  useGetStatsMonthlyCategoriesTransactionsRaw: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<StatsMonthlyCategoriesTransactions[]>>;
  useGetStatsMonthlyAccountsTransactions: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<StatsMonthlyAccountsTransactions[]>>;
  useGetStatsNetWorthGrowth: (startDate?: string, endDate?: string) => ReturnType<typeof useQuery<LineChartPoint[]>>;
  useRefreshAllQueries: () => void;
  useGetDateRanges: () => {
    currentMonth: { start: string; end: string };
    currentYear: { start: string; end: string };
  };
  statsRepo: any;
}

export function useStatsService(): IStatsService {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const statsRepo = dbContext.StatsRepository();
  const transactionRepo = dbContext.TransactionRepository();
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const useGetStatsDailyTransactions = (startDate: string, endDate: string, week = false, type?: TransactionType) => {
    return useQuery({
      queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate, type, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
        return getStatsDailyTransactionsHelper(data, week);
      },
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsDailyTransactionsRaw = (startDate: string, endDate: string, type?: TransactionType) => {
    return useQuery<StatsDailyTransactions[]>({
      queryKey: [ViewNames.StatsDailyTransactions, "raw", startDate, endDate, type, tenantId],
      queryFn: async () => {
        return statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyTransactionsTypes = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
        return getStatsMonthlyTransactionsTypesHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyCategoriesTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<{
      groups: (PieData & { id: string })[];
      categories: (PieData & { id: string })[];
    }>({
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
        return getStatsMonthlyCategoriesTransactionsDashboardHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyAccountsTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<StatsMonthlyAccountsTransactions[]>({
      queryKey: [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  // New: Raw monthly categories transactions (no dashboard helper)
  const useGetStatsMonthlyCategoriesTransactionsRaw = (startDate?: string, endDate?: string) => {
    return useQuery<StatsMonthlyCategoriesTransactions[]>({
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, "raw", startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  const useGetStatsNetWorthGrowth = (startDate?: string, endDate?: string) => {
    return useQuery<LineChartPoint[]>({
      queryKey: [ViewNames.StatsNetWorthGrowth, startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        const data = await statsRepo.getStatsNetWorthGrowth(tenantId, startDate, endDate);
        return getStatsNetWorthGrowthHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useRefreshAllQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsDailyTransactions] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsMonthlyCategoriesTransactions] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsMonthlyTransactionsTypes] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsNetWorthGrowth] });
  };

  const useGetDateRanges = () => ({
    currentMonth: {
      start: dayjs().utc().startOf("month").format("YYYY-MM-DD"),
      end: dayjs().utc().endOf("month").format("YYYY-MM-DD"),
    },
    currentYear: {
      start: dayjs().utc().startOf("year").toISOString(),
      end: dayjs().utc().endOf("year").toISOString(),
    },
  });

  return {
    useGetStatsDailyTransactions,
    useGetStatsDailyTransactionsRaw,
    useGetStatsMonthlyTransactionsTypes,
    useGetStatsMonthlyCategoriesTransactions,
    useGetStatsMonthlyAccountsTransactions,
    useGetStatsNetWorthGrowth,
    useGetStatsMonthlyCategoriesTransactionsRaw,
    useRefreshAllQueries,
    useGetDateRanges,
    statsRepo,
  };
}
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
    dots.push({ key: item.type!, color: dotColor });
    acc[day] = { dots };
    return acc;
  }, {});

  return { barsData, calendarData };
};
const getStatsMonthlyTransactionsTypesHelper = async (
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
const getStatsMonthlyCategoriesTransactionsDashboardHelper = async (
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
const getStatsNetWorthGrowthHelper = async (data: StatsNetWorthGrowth[]): Promise<LineChartPoint[]> => {
  return data.map((item: any) => ({
    x: dayjs(item.month).format("MMM"),
    y: item.total_net_worth ?? 0,
  }));
};
