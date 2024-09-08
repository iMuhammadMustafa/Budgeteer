import React from "react";
import { View, Dimensions, useWindowDimensions, Text } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryTheme } from "victory-native";

type BarType = {
  x: any;
  y: any;
};

export default function Bar({
  data,
  color,
  hideY,
  label,
}: {
  data: BarType[];
  color: any;
  hideY: boolean;
  label: string;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth;

  return (
    <View className="p-5 m-auto">
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>{label}</Text>

      <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 50 }} width={chartWidth}>
        {/* {hideY && (
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: "transparent" }, // Hides the axis line
              ticks: { stroke: "transparent" }, // Hides the tick marks
              tickLabels: { fill: "transparent" }, // Hides the tick labels
              grid: { stroke: "transparent" }, // Hides the grid lines
            }}
          />
        )} */}

        {hideY && <VictoryAxis style={{ grid: { stroke: "transparent" } }} />}
        <VictoryBar
          style={{ data: { fill: `${color ?? ""}` } }}
          barRatio={0.5}
          alignment="middle"
          // barWidth={({ index }) => 30}
          scale={{ x: "linear" }}
          labels={({ datum }) => datum.y}
          // animate={{
          //   duration: 500,
          //   onLoad: { duration: 500 },
          // }}
          data={data}
        />
      </VictoryChart>
    </View>
  );
}
