import {
  useGetLastMonthCategoriesTransactionsSum,
  useGetLastQuraterTransactionsSum,
  useGetLastWeekTransactionsSum,
} from "@/src/repositories/transactions.service";
import { View, ActivityIndicator, ScrollView, SafeAreaView, Platform } from "react-native";
import dayjs from "dayjs";
import Pie from "@/src/components/Charts/Pie";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar, { DoubleBarPoint } from "@/src/components/Charts/DoubleBar";
import PieChartWeb from "@/src/components/Charts/Pie.web";
import utc from "dayjs/plugin/utc";

import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = dayjs().format("dddd");

export default function Dashboard() {
  const { data: lastWeekTransactions, isLoading: isLastWeekTransactionsLoading } = useGetLastWeekTransactionsSum();
  const { data: lastMonthTransactionsCategories, isLoading: isLastMonthTransactionsCategoriesLoading } =
    useGetLastMonthCategoriesTransactionsSum();
  const { data: lastQuarterTransactions, isLoading: isLastQuarterTransactionsLoading } =
    useGetLastQuraterTransactionsSum();

  if (isLastWeekTransactionsLoading || isLastMonthTransactionsCategoriesLoading || isLastQuarterTransactionsLoading) {
    return <ActivityIndicator />;
  }

  const lastWeekExpense = lastWeekTransactions
    ?.filter(item => item.type === "Expense")
    .map(item => ({ ...item, sum: Math.abs(item.sum) }));

  const todaysTransactions = lastWeekExpense?.find(
    i => dayjs().utc().format("YYYY-MM-DD") === dayjs(i.date).format("YYYY-MM-DD"),
  );
  console.log(todaysTransactions, "");
  const lastWeekData = [
    ...daysOfWeek.map(day => ({
      x: day,
      y:
        lastWeekExpense?.find(
          i => dayjs(i.date).format("dddd") === day && dayjs().get("date") !== dayjs(i.date).get("date"),
        )?.sum || 0,
      item: lastWeekExpense?.find(
        i => dayjs(i.date).format("dddd") === day && dayjs().get("date") !== dayjs(i.date).get("date"),
      ),
    })),
    {
      x: "Today",
      y: todaysTransactions?.sum || 0,
      item: todaysTransactions,
    },
  ];

  const netEarningChartExpensesKeyd = lastQuarterTransactions?.reduce((acc: any, transaction: any) => {
    const month = dayjs(transaction.date).format("MMMM");

    if (!acc[month]) {
      acc[month] = { x: month, expense: 0, income: 0 };
    }

    if (transaction.sum < 0) {
      acc[month].expense += Math.abs(transaction.sum);
    } else if (transaction.sum > 0) {
      acc[month].income += transaction.sum;
    }

    return acc;
  }, {});
  const netEarningChartExpenses = Object.values(netEarningChartExpensesKeyd) as DoubleBarPoint[];

  const result = lastMonthTransactionsCategories?.reduce((acc: any, transaction: any) => {
    const name = transaction.name ?? "Null";
    if (transaction.sum >= 0) {
      return acc;
    }
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name] += Math.abs(transaction.sum);
    return acc;
  }, {});

  const pieChart = Object.keys(result).map(name => ({
    x: name,
    y: result[name],
  }));

  const resultGroups = lastMonthTransactionsCategories?.reduce((acc: any, transaction: any) => {
    const name = transaction.group ?? "Null";
    if (transaction.sum >= 0) {
      return acc;
    }
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name] += Math.abs(transaction.sum);
    return acc;
  }, {});

  const pieChartGroup = Object.keys(resultGroups).map(name => ({
    x: name,
    y: resultGroups[name],
  }));

  return (
    <SafeAreaView className="w-full h-full m-auto">
      <ScrollView>
        <View>
          {lastWeekExpense && <Bar data={lastWeekData} hideY color="rgba(255, 0, 0, 0.6)" label="Last Week Expenses" />}
          <DoubleBar data={netEarningChartExpenses} label="Net Earnings" />

          {lastMonthTransactionsCategories &&
            (Platform.OS === "web" ? (
              <>
                <PieChartWeb data={pieChart} />
                <PieChartWeb data={pieChartGroup} />
              </>
            ) : (
              <>
                <Pie data={pieChart} />
                <Pie data={pieChartGroup} />
              </>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
