import {
  useGetLastMonthCategoriesTransactionsSum,
  useGetLastQuraterTransactionsSum,
  useGetLastWeekTransactionsSum,
} from "@/src/repositories/transactions.service";
import { View, Text, ActivityIndicator, ScrollView, SafeAreaView } from "react-native";
import dayjs from "dayjs";
import Pie from "@/src/components/Pie";
import Bar from "@/src/components/Bar";
import DoubleBar, { DoubleBarPoint } from "@/src/components/DoubleBar";

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

  return (
    <SafeAreaView className="w-full h-full m-auto">
      <ScrollView>
        <View>
          {lastWeekExpense && (
            <Bar
              data={lastWeekExpense.map(i => ({ x: dayjs(i.date).format("dddd"), y: i.sum }))}
              hideY
              color="rgba(255, 0, 0, 0.6)"
              label="Last Week Expenses"
            />
          )}
          <DoubleBar data={netEarningChartExpenses} label="Net Earnings" />

          {lastMonthTransactionsCategories && <Pie data={pieChart} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
