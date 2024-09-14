import { useMonthlyTransactions, useWeeklyTransactions } from "@/src/repositories/transactions.service";
import { ActivityIndicator } from "react-native";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import timezone from "dayjs/plugin/timezone";
import { DoubleBarPoint } from "@/src/components/Charts/DoubleBar";
import { BarType } from "@/src/components/Charts/Bar";

dayjs.extend(utc);
dayjs.extend(timezone);
//["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Today"]
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Today"].map(day => {
  return {
    x: day,
    y: 0,
  };
});
const shortDaysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today = dayjs();

interface DashboardProps {
  isLoading: boolean;
  lastWeekExpense: BarType[];
}

interface MonthlyObj {
  categories: {
    Expense: { [name: string]: number };
    Income: { [name: string]: number };
  };
  groups: {
    Expense: { [group: string]: number };
    Income: { [group: string]: number };
  };
  months: {
    [month: string]: {
      Expense: number;
      Income: number;
    };
  };
}

export default function useDashboard() {
  const { data: monthlyTransactions, isLoading: isMonthlyLoading } = useMonthlyTransactions();
  const { data: weeklyTransactions, isLoading: isWeeklyLoading } = useWeeklyTransactions();
  const isLoading = isMonthlyLoading || isWeeklyLoading;

  let lastWeekExpense: BarType[] = [];
  const monthlyObj: MonthlyObj = {
    categories: {
      Expense: {},
      Income: {},
    },
    groups: {
      Expense: {},
      Income: {},
    },
    months: {},
  };

  let monthlyNetEarnings: DoubleBarPoint[] = [];
  let categoriesExpenses = [];
  let categoriesIncomes = [];
  let groupsExpenses = [];
  let groupsIncomes = [];
  let monthsExpenses = [];
  let monthsIncomes = [];

  if (isLoading) return { isLoading, lastWeekExpense, monthlyNetEarnings };

  lastWeekExpense = [
    ...daysOfWeek,
    ...weeklyTransactions!
      .filter(item => item.type === "Expense")
      .map(item => {
        const x = dayjs(item.date).isSame(dayjs(), "date") ? "Today" : dayjs(item.date).format("ddd");
        const y = parseInt(Math.abs(item.sum ?? 0).toFixed(0));
        const color = "rgba(255, 0, 0, 0.6)";
        return { x, y, color, item };
      }),
  ];

  monthlyTransactions!.forEach(transaction => {
    const { name, group, date, sum, type } = transaction;
    const month = dayjs(date).format("MMM");

    if (!name || !group || !date || !sum || !type) return;
    if (type !== "Income" && type !== "Expense") return;

    if (!monthlyObj.categories[type][name]) {
      monthlyObj.categories[type][name] = 0;
    }
    monthlyObj.categories[type][name] += Math.abs(sum);

    if (!monthlyObj.groups[type][group]) {
      monthlyObj.groups[type][group] = 0;
    }
    monthlyObj.groups[type][group] += Math.abs(sum);

    if (!monthlyObj.months[month]) {
      monthlyObj.months[month] = {
        Expense: 0,
        Income: 0,
      };
    }
    if (!monthlyObj.months[month][type]) {
      monthlyObj.months[month][type] = 0;
    }
    monthlyObj.months[month][type] += Math.abs(sum);
  });

  monthlyNetEarnings = Object.keys(monthlyObj.months).map(month => {
    return {
      x: month,
      barOne: {
        label: "Income",
        value: monthlyObj.months[month].Income,
        color: "rgba(76, 175, 80, 0.6)",
      },
      barTwo: {
        label: "Expense",
        value: monthlyObj.months[month].Expense,
        color: "rgba(244, 67, 54, 0.6)",
      },
    };
  });

  return {
    isLoading,
    lastWeekExpense,
    monthlyNetEarnings,
  };
}
