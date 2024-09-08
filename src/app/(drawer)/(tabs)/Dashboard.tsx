import {
  useGetLastMonthCategoriesTransactionsSum,
  useGetLastQuraterTransactionsSum,
  useGetLastWeekTransactionsSum,
  useGetTransactions,
} from "@/src/repositories/transactions.service";
import { View, Text, Dimensions, ActivityIndicator, ScrollView, SafeAreaView, Alert } from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from "react-native-chart-kit";
import MyPie from "@/src/components/PieChart";
import dayjs from "dayjs";
import { VictoryBar, VictoryChart, VictoryContainer, VictoryLabel, VictoryPie, VictoryTheme } from "victory-native";
import Pie from "@/src/components/Pie";
import Bar from "@/src/components/Bar";
import DoubleBar from "@/src/components/DoubleBar";

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

  const lastWeekIncome = lastWeekTransactions?.filter(item => item.type === "Income");

  const result = lastMonthTransactionsCategories.reduce((acc, transaction) => {
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
  console.log(pieChart);

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
  const netEarningChartExpenses = Object.values(netEarningChartExpensesKeyd);

  // const { width, height } = Dimensions.get("window");

  // const chartConfigs = [
  //   {
  //     backgroundColor: "#000000",
  //     backgroundGradientFrom: "#1E2923",
  //     backgroundGradientTo: "#08130D",
  //     color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  //     style: {
  //       borderRadius: 16,
  //     },
  //   },
  //   {
  //     backgroundColor: "#022173",
  //     backgroundGradientFrom: "#022173",
  //     backgroundGradientTo: "#1b3fa0",
  //     color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  //     style: {
  //       borderRadius: 16,
  //     },
  //   },
  //   {
  //     backgroundColor: "#ffffff",
  //     backgroundGradientFrom: "#ffffff",
  //     backgroundGradientTo: "#ffffff",
  //     color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  //   },
  //   {
  //     backgroundColor: "#26872a",
  //     backgroundGradientFrom: "#43a047",
  //     backgroundGradientTo: "#66bb6a",
  //     color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  //     style: {
  //       borderRadius: 16,
  //     },
  //   },
  //   {
  //     backgroundColor: "#000000",
  //     backgroundGradientFrom: "#000000",
  //     backgroundGradientTo: "#000000",
  //     color: (opacity = 1) => `rgba(${255}, ${255}, ${255}, ${opacity})`,
  //   },
  //   {
  //     backgroundColor: "#0091EA",
  //     backgroundGradientFrom: "#0091EA",
  //     backgroundGradientTo: "#0091EA",
  //     color: (opacity = 1) => `rgba(${255}, ${255}, ${255}, ${opacity})`,
  //   },
  //   {
  //     backgroundColor: "#e26a00",
  //     backgroundGradientFrom: "#fb8c00",
  //     backgroundGradientTo: "#ffa726",
  //     color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  //     style: {
  //       borderRadius: 16,
  //     },
  //   },
  //   {
  //     backgroundColor: "#b90602",
  //     backgroundGradientFrom: "#e53935",
  //     backgroundGradientTo: "#ef5350",
  //     color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  //     style: {
  //       borderRadius: 16,
  //     },
  //   },
  //   {
  //     backgroundColor: "#ff3e03",
  //     backgroundGradientFrom: "#ff3e03",
  //     backgroundGradientTo: "#ff3e03",
  //     color: (opacity = 1) => `rgba(${0}, ${0}, ${0}, ${opacity})`,
  //   },
  // ];
  // // console.log(points);

  // const getRandomColor = () => {
  //   const letters = "0123456789ABCDEF";
  //   let color = "#";
  //   for (let i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return color;
  // };

  // const handleSlicePress = slice => {
  //   Alert.alert("Pie Slice Clicked", `You clicked on ${slice.name}`);
  // };

  // const testData = [
  //   { name: "Category 1", sum: 50, color: "#ff0000" },
  //   { name: "Category 2", sum: 30, color: "#00ff00" },
  //   { name: "Category 3", sum: 20, color: "#0000ff" },
  // ];

  // function randomNumber() {
  //   return Math.floor(Math.random() * 26) + 125;
  // }
  // function generateRandomColor(): string {
  //   // Generating a random number between 0 and 0xFFFFFF
  //   const randomColor = Math.floor(Math.random() * 0xffffff);
  //   // Converting the number to a hexadecimal string and padding with zeros
  //   return `#${randomColor.toString(16).padStart(6, "0")}`;
  // }
  // const DATA = (numberPoints = 5) =>
  //   Array.from({ length: numberPoints }, (_, index) => ({
  //     value: randomNumber(),
  //     color: generateRandomColor(),
  //     label: `Label ${index + 1}`,
  //   }));

  // const data = [
  //   { quarter: 1, earnings: 13000 },
  //   { quarter: 2, earnings: 16500 },
  //   { quarter: 3, earnings: 14250 },
  //   { quarter: 4, earnings: 19000 },
  // ];
  // }
  return (
    <SafeAreaView className="w-full h-full m-auto">
      <ScrollView>
        <View>
          <Text>Last Week Insights</Text>

          <DoubleBar data={netEarningChartExpenses} />
          {lastWeekExpense && (
            <Bar
              data={lastWeekExpense.map(i => ({ x: dayjs(i.date).format("dddd"), y: i.sum }))}
              hideY
              color="rgba(255, 0, 0, 0.6)"
            />
          )}
          {/* {lastWeekIncome && (
            <Bar
              data={lastWeekIncome.map(i => ({ x: dayjs(i.date).format("dddd"), y: i.sum }))}
              hideY
              color="rgba(0, 129, 134, 0.6)"
            />
          )} */}

          {lastMonthTransactionsCategories && <Pie data={pieChart} />}
          {/* <View className="w-full max-w-full m-5 p-5">
            {lastWeekExpense && (
              <BarChart
                data={{
                  labels: lastWeekExpense.map(i => dayjs(i.date).format("DD/MMM/YYYY")),
                  datasets: [{ data: lastWeekExpense.map(i => i.sum) }],
                }}
                height={Dimensions.get("window").height / 2}
                yAxisLabel="$"
                verticalLabelRotation={45}
                width={width * 0.8} // from react-native
                fromZero={true}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0, // optional, defaults to 2dp
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
              />
            )}
          </View>
          <View className="w-full max-w-full m-5 p-5">
            {lastWeekIncome && (
              <BarChart
                data={{
                  labels: lastWeekIncome.map(i => dayjs(i.date).format("DD/MMM/YYYY")),
                  datasets: [{ data: lastWeekIncome.map(i => i.sum) }],
                }}
                height={Dimensions.get("window").height / 2}
                yAxisLabel="$"
                verticalLabelRotation={45}
                width={width * 0.8} // from react-native
                fromZero={true}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0, // optional, defaults to 2dp
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726",
                  },
                }}
              />
            )}
          </View> */}

          {/* <View className="w-full max-w-full m-5 p-5">
            {lastMonthTransactionsCategories && (
              <PieChart
                accessor={"sum"}
                backgroundColor={"transparent"}
                center={[10, 50]}
                absolute
                data={lastMonthTransactionsCategories
                  .filter(x => x.sum && x.sum < 0)
                  .map(item => ({
                    name: item.name,
                    sum: Math.abs(item.sum!),
                    color: getRandomColor(),
                  }))}
                height={Dimensions.get("window").height / 2}
                yAxisLabel="$"
                width={Dimensions.get("window").width} // from react-native
                fromZero={true}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#fff",
                  },
                }}
              />
            )}
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
