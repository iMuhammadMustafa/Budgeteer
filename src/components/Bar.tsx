import React, { useState } from "react";
import { View, Dimensions, useWindowDimensions, Text, Platform } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryTheme } from "victory-native";

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
  console.log(width);
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth;

  const [selectedSlice, setSelectedSlice] = useState(null);
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

        {Platform.OS === "web" ? (
          <VictoryAxis style={{ grid: { stroke: "transparent" } }} />
        ) : (
          <VictoryAxis
            tickLabelComponent={<VictoryLabel dx={10} angle={20} />}
            style={{ grid: { stroke: "transparent" } }}
          />
        )}
        {!hideY && <VictoryAxis dependentAxis style={{ grid: { stroke: "transparent" } }} />}
        <VictoryBar
          style={{
            data: {
              fill: `${color ?? ""}`,
              fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.8),
              stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
              strokeWidth: 2,
            },
          }}
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
          // data: {
          //   fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.7),
          //   stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
          //   strokeWidth: 2,
          // }

          events={[
            {
              target: "data",
              eventHandlers: {
                onMouseEnter: (_, props) => {
                  setSelectedSlice(selectedSlice === props.datum.x ? null : props.datum.x);
                },
                onMouseLeave: (_, props) => {
                  setSelectedSlice(null);
                },
                onPress: (_, props) => {
                  console.log(props.datum.item);
                },
              },
            },
          ]}
        />
      </VictoryChart>
    </View>
  );
}
