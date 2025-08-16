import { useQuery } from "@tanstack/react-query";
import { ViewNames } from "@/src/types/db/TableNames";
import {
  StatsDailyTransactions,
  StatsMonthlyAccountsTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/db/Tables.Types";
import {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";

export function useStatsService() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const statsRepo = dbContext.StatsRepository();
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const getStatsDailyTransactions = (
    startDate: string,
    endDate: string,
    week = false,
    type: TransactionType = "Expense",
  ) => {
    return useQuery({
      queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate, type, tenantId, "repo"],
      queryFn: async () => {
        const data = await statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
        return getStatsDailyTransactionsHelper(data, week);
      },
    });
  };

  const getStatsMonthlyTransactionsTypes = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate, tenantId, "repo"],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
        return getStatsMonthlyTransactionsTypesHelper(data);
      },
      enabled: !!tenantId,
    });
  };

  const getStatsMonthlyCategoriesTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<{
      groups: (PieData & { id: string })[];
      categories: (PieData & { id: string })[];
    }>({
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, tenantId, "repo"],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
        return getStatsMonthlyCategoriesTransactionsDashboardHelper(data);
      },
      enabled: !!tenantId,
    });
  };

  const getStatsMonthlyAccountsTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<StatsMonthlyAccountsTransactions[]>({
      queryKey: [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  const getStatsNetWorthGrowth = (startDate?: string, endDate?: string) => {
    return useQuery<LineChartPoint[]>({
      queryKey: [ViewNames.StatsNetWorthGrowth, startDate, endDate, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        const data = await statsRepo.getStatsNetWorthGrowth(tenantId, startDate, endDate);
        return getStatsNetWorthGrowthHelper(data);
      },
      enabled: !!tenantId,
    });
  };

  // Legacy hooks for backward compatibility
  // const useGetStatsDailyTransactions = (startDate: string, endDate: string, week = false) =>
  //   useGetStatsDailyTransactionsLegacy(startDate, endDate, week);
  // const useGetStatsYearTransactionsTypes = (startDate: string, endDate: string) =>
  //   useGetStatsYearTransactionsTypesLegacy(startDate, endDate);
  // const useGetStatsMonthlyCategoriesTransactions = (startDate: string, endDate: string) =>
  //   useGetStatsMonthlyCategoriesTransactionsLegacy(startDate, endDate);
  // const useGetStatsMonthlyCategoriesTransactionsForDashboard = (startDate: string, endDate: string) =>
  //   useGetStatsMonthlyCategoriesTransactionsForDashboardLegacy(startDate, endDate);
  // const useGetStatsMonthlyAccountsTransactions = (startDate: string, endDate: string) =>
  //   useGetStatsMonthlyAccountsTransactionsLegacy(startDate, endDate);
  // const useGetStatsNetWorthGrowth = (startDate: string, endDate: string) =>
  //   useGetStatsNetWorthGrowthLegacy(startDate, endDate);

  return {
    // Repository-based methods (new)
    getStatsDailyTransactions,
    getStatsMonthlyTransactionsTypes,
    getStatsMonthlyCategoriesTransactions,
    getStatsMonthlyAccountsTransactions,
    getStatsNetWorthGrowth,

    // Legacy methods (backward compatibility)
    // useGetStatsDailyTransactions,
    // useGetStatsYearTransactionsTypes,
    // useGetStatsMonthlyCategoriesTransactions,
    // useGetStatsMonthlyCategoriesTransactionsForDashboard,
    // useGetStatsMonthlyAccountsTransactions,
    // useGetStatsNetWorthGrowth,

    // Direct repository access
    statsRepo,
  };
}
const getStatsDailyTransactionsHelper = async (
  data: StatsDailyTransactions[],
  week = false,
): Promise<{
  barsData?: BarDataType[];
  calendarData: MyCalendarData;
}> => {
  let barsData: BarDataType[] | undefined = undefined;
  if (week) {
    const today = dayjs().format("ddd");
    const thisWeekData = data
      .filter(
        (item: any) =>
          dayjs(item.date).local() >= dayjs().startOf("week").local() &&
          dayjs(item.date).local() <= dayjs().endOf("week").local(),
      )
      .map((item: any) => {
        const x = dayjs(item.date).format("ddd");
        const y = Math.abs(item.sum ?? 0);
        const color = (item.sum ?? 0) > 0 ? "rgba(76, 175, 80, 0.6)" : "rgba(244, 67, 54, 0.6)";
        return { x, y, color, item };
      });
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    barsData = daysOfWeek.map(day => {
      const dayData = thisWeekData.find((x: any) => x.x === day);
      const x = today === day ? "Today" : day;
      return {
        x,
        y: dayData?.y ?? 0,
        color: dayData?.color ?? "rgba(255, 255, 255, 0.6)",
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

// Legacy functions for backward compatibility
// export const useGetStatsDailyTransactionsLegacy = (startDate: string, endDate: string, week = false) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<{
//     barsData?: BarDataType[];
//     calendarData: MyCalendarData;
//   }>({
//     queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsDailyTransactionsHelper(tenantId, startDate, endDate, week);
//     },
//     enabled: !!tenantId,
//   });
// };

// const getStatsDailyTransactionsHelper = async (
//   tenantId: string,
//   startDate: string,
//   endDate: string,
//   week = false,
// ): Promise<{
//   barsData?: BarDataType[];
//   calendarData: MyCalendarData;
// }> => {
//   const data = await getStatsDailyTransactions(tenantId, startDate, endDate, "Expense");

//   let barsData: BarDataType[] | undefined = undefined;
//   if (week) {
//     const today = dayjs().format("ddd");
//     const thisWeekData = data
//       .filter(
//         (item: any) =>
//           dayjs(item.date).local() >= dayjs().startOf("week").local() &&
//           dayjs(item.date).local() <= dayjs().endOf("week").local(),
//       )
//       .map((item: any) => {
//         const x = dayjs(item.date).format("ddd");
//         const y = Math.abs(item.sum ?? 0);
//         const color = (item.sum ?? 0) > 0 ? "rgba(76, 175, 80, 0.6)" : "rgba(244, 67, 54, 0.6)";
//         return { x, y, color, item };
//       });
//     const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//     barsData = daysOfWeek.map(day => {
//       const dayData = thisWeekData.find((x: any) => x.x === day);
//       const x = today === day ? "Today" : day;
//       return {
//         x,
//         y: dayData?.y ?? 0,
//         color: dayData?.color ?? "rgba(255, 255, 255, 0.6)",
//       };
//     });
//   }

//   const calendarData: MyCalendarData = data.reduce((acc: MyCalendarData, item: any) => {
//     const day = dayjs(item.date).format("YYYY-MM-DD");
//     const dots = acc[day]?.dots ?? [];
//     const dotColor = item.type === "Income" ? "green" : item.type === "Expense" ? "red" : "teal";
//     dots.push({ key: item.type!, color: dotColor });
//     acc[day] = { dots };
//     return acc;
//   }, {});

//   return { barsData, calendarData };
// };

// export const useGetStatsYearTransactionsTypesLegacy = (startDate: string, endDate: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<DoubleBarPoint[]>({
//     queryKey: [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsMonthlyTransactionsTypesHelper(tenantId, startDate, endDate);
//     },
//     enabled: !!tenantId,
//   });
// };

// const getStatsMonthlyTransactionsTypesHelper = async (
//   tenantId: string,
//   startDate: string,
//   endDate: string,
// ): Promise<DoubleBarPoint[]> => {
//   const data = await getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);

//   type Item = {
//     [x: string]: {
//       expensesSum: number;
//       incomeSum: number;
//     };
//   };
//   const items = data.reduce((acc: Item, item: any) => {
//     let month = dayjs(item.date).format("MMM");
//     let income = item.type === "Income" ? (item.sum ?? 0) : 0;
//     let expense = item.type === "Expense" ? (item.sum ?? 0) : 0;

//     let newItem = acc[month];

//     if (newItem) {
//       newItem.expensesSum += expense;
//       newItem.incomeSum += income;
//     } else {
//       acc[month] = {
//         expensesSum: expense,
//         incomeSum: income,
//       };
//     }
//     return acc;
//   }, {});

//   const barsData: DoubleBarPoint[] = Object.entries(items).map(([month, item]) => {
//     return {
//       x: month,
//       barOne: {
//         label: "Income",
//         value: (item as any).incomeSum,
//         color: "rgba(76, 175, 80, 0.6)",
//       },
//       barTwo: {
//         label: "Expense",
//         value: Math.abs((item as any).expensesSum),
//         color: "rgba(244, 67, 54, 0.6)",
//       },
//     };
//   });

//   return barsData;
// };

// export const useGetStatsMonthlyCategoriesTransactionsLegacy = (startDate: string, endDate: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<StatsMonthlyCategoriesTransactions[]>({
//     queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
//     },
//     enabled: !!tenantId,
//   });
// };

// export const useGetStatsMonthlyCategoriesTransactionsForDashboardLegacy = (startDate: string, endDate: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<{
//     groups: (PieData & { id: string })[];
//     categories: (PieData & { id: string })[];
//   }>({
//     queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, "dashboard", tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsMonthlyCategoriesTransactionsDashboardHelper(tenantId, startDate, endDate);
//     },
//     enabled: !!tenantId,
//   });
// };

// const getStatsMonthlyCategoriesTransactionsDashboardHelper = async (
//   tenantId: string,
//   startDate: string,
//   endDate: string,
// ): Promise<{
//   groups: (PieData & { id: string })[];
//   categories: (PieData & { id: string })[];
// }> => {
//   const data = await getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);

//   // Group data by IDs
//   const groupsMap = new Map<string, { sum: number; name: string }>();
//   const categoriesMap = new Map<string, { sum: number; name: string }>();

//   data.forEach((item: any) => {
//     if (item.groupid && item.sum && item.groupname) {
//       const currentData = groupsMap.get(item.groupid) || { sum: 0, name: item.groupname };
//       groupsMap.set(item.groupid, {
//         sum: currentData.sum + Math.abs(item.sum),
//         name: item.groupname,
//       });
//     }

//     if (item.categoryid && item.sum && item.groupname && item.categoryname) {
//       const currentData = categoriesMap.get(item.categoryid) || {
//         sum: 0,
//         name: `${item.groupname}:${item.categoryname}`,
//       };
//       categoriesMap.set(item.categoryid, {
//         sum: currentData.sum + Math.abs(item.sum),
//         name: `${item.categoryname}`,
//       });
//     }
//   });

//   // Convert maps to arrays of PieData with IDs
//   const groups = Array.from(groupsMap.entries()).map(([id, data]) => ({
//     x: data.name,
//     y: data.sum,
//     id: id,
//   }));

//   const categories = Array.from(categoriesMap.entries()).map(([id, data]) => ({
//     x: data.name,
//     y: data.sum,
//     id: id,
//   }));

//   return { groups, categories };
// };

// export const useGetStatsMonthlyAccountsTransactionsLegacy = (startDate: string, endDate: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<StatsMonthlyAccountsTransactions[]>({
//     queryKey: [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsMonthlyAccountsTransactionsHelper(tenantId, startDate, endDate);
//     },
//     enabled: !!tenantId,
//   });
// };

// const getStatsMonthlyAccountsTransactionsHelper = async (tenantId: string, startDate: string, endDate: string) => {
//   return await getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
// };

// export const useGetStatsNetWorthGrowthLegacy = (startDate: string, endDate: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<LineChartPoint[]>({
//     queryKey: [ViewNames.StatsNetWorthGrowth, startDate, endDate, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getStatsNetWorthGrowthHelper(tenantId, startDate, endDate);
//     },
//     enabled: !!tenantId,
//   });
// };

// const getStatsNetWorthGrowthHelper = async (
//   tenantId: string,
//   startDate: string,
//   endDate: string,
// ): Promise<LineChartPoint[]> => {
//   const data = await getStatsNetWorthGrowth(tenantId, startDate, endDate);
//   return data.map((item: any) => ({
//     x: dayjs(item.month).format("MMM"),
//     y: item.total_net_worth ?? 0,
//   }));
// };

// Maintain legacy exports for backward compatibility
// export const useGetStatsDailyTransactions = useGetStatsDailyTransactionsLegacy;
// export const useGetStatsYearTransactionsTypes = useGetStatsYearTransactionsTypesLegacy;
// export const useGetStatsMonthlyCategoriesTransactions = useGetStatsMonthlyCategoriesTransactionsLegacy;
// export const useGetStatsMonthlyCategoriesTransactionsForDashboard =
//   useGetStatsMonthlyCategoriesTransactionsForDashboardLegacy;
// export const useGetStatsMonthlyAccountsTransactions = useGetStatsMonthlyAccountsTransactionsLegacy;
// export const useGetStatsNetWorthGrowth = useGetStatsNetWorthGrowthLegacy;
