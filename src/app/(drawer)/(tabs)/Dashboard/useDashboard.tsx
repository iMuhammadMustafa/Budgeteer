import { useMemo } from "react";
import {
  useMonthlyTransactions,
  useDailyTransactionsSummary,
  useDailyTransactionsSummaryThisMonth,
} from "@/src/repositories/transactions.service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DoubleBarPoint } from "@/src/components/Charts/DoubleBar";
import { BarType } from "@/src/components/Charts/Bar";
import { PieData } from "@/src/components/Charts/MyPie";
import { CalendarDayProp } from "@/src/components/Charts/MyCalendar";

dayjs.extend(utc);
dayjs.extend(timezone);
//["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Today"]
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Today"].map(day => {
  return {
    x: day,
    y: 0,
  };
});
const currentMonthShort = dayjs().format("MMM");
const today = dayjs();

type ChartsObject = {
  [month: string]: {
    Expense: number;
    Income: number;
    categories: {
      [name: string]: {
        [type: string]: number;
      };
    };
    groups: GroupType;
  };
};
type GroupType = {
  [group: string]: {
    [group: string]: number;
  };
};

export default function useDashboard() {
  const { data: monthlyTransactions = [], isLoading: isMonthlyLoading } = useMonthlyTransactions();
  const { data: weeklyTransactions = [], isLoading: isWeeklyLoading } = useDailyTransactionsSummary();
  const { data: thisMonthsTransactions = [], isLoading: isThisMonthLoading } = useDailyTransactionsSummaryThisMonth();
  const isLoading = isMonthlyLoading || isWeeklyLoading || isThisMonthLoading;

  const chartsObj: ChartsObject = {};

  monthlyTransactions.forEach(transaction => {
    const { name, group, date, sum, type } = transaction;
    const month = dayjs(date).format("MMM");

    if (!name || !group || !date || !sum || !type) return;
    if (type !== "Income" && type !== "Expense") return;

    if (!chartsObj[month]) {
      chartsObj[month] = {
        Expense: 0,
        Income: 0,
        categories: {},
        groups: {},
      };
    }
    chartsObj[month][type] += Math.abs(sum);

    if (Math.abs(sum) > 0) {
      if (!chartsObj[month].categories[name]) {
        chartsObj[month].categories[name] = {
          Expense: 0,
          Income: 0,
        };
      }
      chartsObj[month].categories[name][type] += Math.abs(sum);

      if (!chartsObj[month].groups[group]) {
        chartsObj[month].groups[group] = {
          Expense: 0,
          Income: 0,
        };
      }
      chartsObj[month].groups[group][type] += Math.abs(sum);
    }
  });

  const lastWeekExpense: BarType[] = useMemo(() => {
    if (isLoading) {
      return [];
    }

    return [
      ...daysOfWeek,
      ...(weeklyTransactions
        .filter(item => item.type === "Expense")
        .map(item => {
          const x = dayjs(item.date).isSame(today, "date") ? "Today" : dayjs(item.date).format("ddd");
          const y = Math.abs(item.sum ?? 0);
          return { x, y, color: "rgba(255, 0, 0, 0.6)", item };
        }) || []),
    ];
  }, [isLoading, weeklyTransactions, daysOfWeek]);

  const monthlyNetEarnings: DoubleBarPoint[] = useMemo(() => {
    return Object.keys(chartsObj).map(month => ({
      x: month,
      barOne: {
        label: "Income",
        value: chartsObj[month].Income,
        color: "rgba(76, 175, 80, 0.6)",
      },
      barTwo: {
        label: "Expense",
        value: chartsObj[month].Expense,
        color: "rgba(244, 67, 54, 0.6)",
      },
    }));
  }, [chartsObj]);

  const mapToPieData = (data: GroupType) => {
    return Object.keys(data).map(key => ({
      x: key,
      y: data[key].Expense, // or data[key].Income if needed
    }));
  };

  const categoriesExpensesThisMonth: PieData[] = useMemo(() => {
    return currentMonthShort in chartsObj ? mapToPieData(chartsObj[currentMonthShort].categories) : [];
  }, [chartsObj, currentMonthShort]);

  const groupsExpensesThisMonth: PieData[] = useMemo(() => {
    return currentMonthShort in chartsObj ? mapToPieData(chartsObj[currentMonthShort].groups) : [];
  }, [chartsObj, currentMonthShort]);

  const thisMonthsTransactionsCalendarObject = thisMonthsTransactions.reduce(
    (acc: { [day: string]: CalendarDayProp }, transaction) => {
      const { date, sum } = transaction;
      const day = dayjs(date).format("YYYY-MM-DD");
      const dots = acc[day]?.dots ?? [];
      const dotColor = transaction.type === "Income" ? "green" : transaction.type === "Expense" ? "red" : "teal";

      dots.push({ key: transaction.type!, color: dotColor });
      acc[day] = { dots };

      return acc;
    },
    {} as { [day: string]: CalendarDayProp },
  );

  console.log(thisMonthsTransactionsCalendarObject);

  return {
    isLoading,
    lastWeekExpense,
    monthlyNetEarnings,
    categoriesExpensesThisMonth,
    groupsExpensesThisMonth,
    thisMonthsTransactionsCalendarObject,
  };
}
