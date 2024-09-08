import {
  useGetLastMonthCategoriesTransactionsSum,
  useGetLastWeekTransactionsSum,
  useGetTransactions,
} from "@/src/repositories/transactions.service";
import { View, Text, Dimensions, ActivityIndicator, ScrollView, SafeAreaView } from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from "react-native-chart-kit";
import dayjs from "dayjs";

export default function Dashboard() {
  const { data: lastWeekTransactions, isLoading: isLastWeekTransactionsLoading } = useGetLastWeekTransactionsSum();
  const { data: lastMonthTransactionsCategories, isLoading: isLastMonthTransactionsCategoriesLoading } =
    useGetLastMonthCategoriesTransactionsSum();

  const lastWeekExpense = lastWeekTransactions
    ?.filter(item => item.type === "expense")
    .map(item => ({ ...item, sum: Math.abs(item.sum) }));
  const lastWeekIncome = lastWeekTransactions?.filter(item => item.type === "income");

  if (isLastWeekTransactionsLoading || isLastMonthTransactionsCategoriesLoading) {
    return <ActivityIndicator />;
  }

  const chartConfigs = [
    {
      backgroundColor: "#000000",
      backgroundGradientFrom: "#1E2923",
      backgroundGradientTo: "#08130D",
      color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    },
    {
      backgroundColor: "#022173",
      backgroundGradientFrom: "#022173",
      backgroundGradientTo: "#1b3fa0",
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    },
    {
      backgroundColor: "#ffffff",
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    },
    {
      backgroundColor: "#26872a",
      backgroundGradientFrom: "#43a047",
      backgroundGradientTo: "#66bb6a",
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    },
    {
      backgroundColor: "#000000",
      backgroundGradientFrom: "#000000",
      backgroundGradientTo: "#000000",
      color: (opacity = 1) => `rgba(${255}, ${255}, ${255}, ${opacity})`,
    },
    {
      backgroundColor: "#0091EA",
      backgroundGradientFrom: "#0091EA",
      backgroundGradientTo: "#0091EA",
      color: (opacity = 1) => `rgba(${255}, ${255}, ${255}, ${opacity})`,
    },
    {
      backgroundColor: "#e26a00",
      backgroundGradientFrom: "#fb8c00",
      backgroundGradientTo: "#ffa726",
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    },
    {
      backgroundColor: "#b90602",
      backgroundGradientFrom: "#e53935",
      backgroundGradientTo: "#ef5350",
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    },
    {
      backgroundColor: "#ff3e03",
      backgroundGradientFrom: "#ff3e03",
      backgroundGradientTo: "#ff3e03",
      color: (opacity = 1) => `rgba(${0}, ${0}, ${0}, ${opacity})`,
    },
  ];
  // console.log(points);

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <SafeAreaView className="w-full h-full m-auto">
      <ScrollView>
        <View>
          <Text>Last Week Insights</Text>
          <View className="w-full max-w-full m-5 p-5">
            {lastWeekExpense && (
              <BarChart
                data={{
                  labels: lastWeekExpense.map(i => dayjs(i.date).format("DD/MMM/YYYY")),
                  datasets: [{ data: lastWeekExpense.map(i => i.sum) }],
                }}
                height={Dimensions.get("window").height / 2}
                yAxisLabel="$"
                verticalLabelRotation={45}
                width={Dimensions.get("window").width} // from react-native
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
                width={Dimensions.get("window").width} // from react-native
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
          </View>
          <View className="w-full max-w-full m-5 p-5">
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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
