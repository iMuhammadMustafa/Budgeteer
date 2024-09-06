import { useGetTransactions } from "@/src/repositories/transactions.service";
import { View, Text, Dimensions, ActivityIndicator } from "react-native";
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
  const { data: transactions, error, isLoading } = useGetTransactions();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  const groupedData = transactions
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    .reduce((acc, curr) => {
      const date = dayjs(curr.date).format("DD MMM YYYY");
      if (!acc[date]) {
        acc[date] = {
          amount: 0,
          transactions: [],
        };
      }
      acc[date].amount += curr.amount;
      return acc;
    }, {});

  const points = Object.keys(groupedData).map(date => {
    return { day: date, amount: groupedData[date].amount };
  });

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

  return (
    <View>
      <Text>Bezier Line Chart</Text>
      <View>
        {/* <CartesianChart data={points} xKey="Days" yKeys={["Spent"]}>
          {({ points, chartBounds }) => (
            //👇 pass a PointsArray to the Bar component, as well as options.

            // console.log(points, chartBounds)
            <Bar
              points={points.amount}
              chartBounds={chartBounds}
              color="red"
              roundedCorners={{ topLeft: 10, topRight: 10 }}
            />
          )}
        </CartesianChart> */}
      </View>

      <View>
        <BarChart
          data={{ labels: points.map(i => i.day), datasets: [{ data: points.map(i => i.amount) }] }}
          height={Dimensions.get("window").height / 2}
          yAxisLabel="$"
          verticalLabelRotation={45}
          width={Dimensions.get("window").width} // from react-native
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
      </View>
    </View>
  );
}
