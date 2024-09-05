import { useGetTransactions } from "@/src/repositories/transactions.service";
import { View, Text, Dimensions } from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from "react-native-chart-kit";
import { CartesianChart, Bar } from "victory-native";

export default function Dashboard() {
  const { data: transactions, error, isLoading } = useGetTransactions();
  const groupedData = transactions
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    .reduce((acc, curr) => {
      const date = dayjs(curr.date).format("ddd, DD MMM YYYY");
      if (!acc[date]) {
        acc[date] = {
          amount: 0,
          transactions: [],
        };
      }
      acc[date].amount += curr.amount;
      acc[date].transactions.push(curr);
      return acc;
    }, {});

  return (
    <View>
      <Text>Bezier Line Chart</Text>
      {/* <View>
        <CartesianChart data={groupedData} xKey="Days" yKeys={["Spent"]}>
          {({ points, chartBounds }) => (
            //👇 pass a PointsArray to the Bar component, as well as options.
            <Bar
              points={points.amount}
              chartBounds={chartBounds}
              color="red"
              roundedCorners={{ topLeft: 10, topRight: 10 }}
            />
          )}
        </CartesianChart>
      </View>
      <View>
        <BarChart
          style={graphStyle}
          data={groupedData.map()}
          width={screenWidth}
          height={220}
          yAxisLabel="$"
          chartConfig={chartConfig}
          verticalLabelRotation={30}
        />
      </View> */}
    </View>
  );
}
