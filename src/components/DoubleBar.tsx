import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend, VictoryTheme } from "victory-native";

type DataPoint = {
  x: string;
  income: number;
  expense: number;
};

// const data: DataPoint[] = [
//   { x: "July 2024", income: 0, expense: 0 },
//   { x: "August 2024", income: 9895.13, expense: 2655.06 },
//   { x: "September 2024", income: 1978.1, expense: 565.91 },
// ];

export default function NetEarningsChart({ data }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth * 0.75;

  return (
    <View style={{ width: chartWidth, alignSelf: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Net Earnings</Text>
      <VictoryChart
        width={chartWidth}
        height={chartHeight}
        domainPadding={{ x: 50, y: 10 }}
        theme={VictoryTheme.material}
        padding={{ top: 40, bottom: 50, left: 60, right: 40 }}
      >
        <VictoryAxis
          tickFormat={t => t}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={t => t}
          // tickFormat={t => `${t / 1000}k`}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryGroup offset={chartWidth / 10}>
          <VictoryBar
            data={data}
            x="x"
            y="income"
            labels={({ datum }) =>
              datum._y.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            }
            style={{ data: { fill: "#4CAF50" } }}
          />
          <VictoryBar
            data={data}
            x="x"
            y="expense"
            labels={({ datum }) =>
              datum._y.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            }
            style={{ data: { fill: "#F44336" } }}
          />
        </VictoryGroup>
        <VictoryLegend
          x={chartWidth / 2}
          y={0}
          orientation="horizontal"
          gutter={20}
          style={{ labels: { fontSize: 10 } }}
          data={[
            { name: "Income", symbol: { fill: "#4CAF50" } },
            { name: "Expense", symbol: { fill: "#F44336" } },
          ]}
        />
      </VictoryChart>
    </View>
  );
}