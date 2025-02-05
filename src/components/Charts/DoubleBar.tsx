import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend, VictoryTheme } from "victory-native";

export type DoubleBarPoint = {
  x: string;
  barOne: {
    label: string;
    value: number;
    color: string;
  };
  barTwo: {
    label: string;
    value: number;
    color: string;
  };
};

export default function NetEarningsChart({ data, label }: { data: DoubleBarPoint[]; label: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth * 0.75;

  return (
    <View className="bg-card p-2 m-auto my-1 rounded-md border border-muted">
      <Text className="text-start text-xl font-bold text-foreground">{label}</Text>
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
            y={data => data.barOne.value}
            labels={({ datum }) => datum.barOne.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            style={{ data: { fill: ({ datum }) => datum.barOne.color || "black" } }}
            animate={{
              onLoad: { duration: 500 },
            }}
          />
          <VictoryBar
            data={data}
            x="x"
            y={data => data.barTwo.value}
            labels={({ datum }) =>
              datum.barTwo.value.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            }
            style={{ data: { fill: ({ datum }) => datum.barTwo.color || "black" } }}
            animate={{
              onLoad: { duration: 500 },
            }}
          />
        </VictoryGroup>
        <VictoryLegend
          x={chartWidth / 2}
          y={0}
          orientation="horizontal"
          gutter={20}
          style={{ labels: { fontSize: 10 } }}
          data={
            data.length > 0
              ? [
                  { name: data[0].barOne.label, symbol: { fill: data[0].barOne.color } },
                  { name: data[0].barTwo.label, symbol: { fill: data[0].barTwo.color } },
                ]
              : []
          }
        />
      </VictoryChart>
    </View>
  );
}
