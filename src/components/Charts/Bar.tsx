import { BarProps } from "@/src/types/components/Charts.types";
import { useState } from "react";
import { Platform, Text, useWindowDimensions, View } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryTheme } from "victory-native";

export default function Bar({ data, label, color, hideY, selectedDate, onDayPress }: BarProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth;

  const [selectedSlice, setSelectedSlice] = useState(selectedDate || null);
  return (
    <View className="p-2  m-auto bg-card my-2 rounded-md border border-muted">
      <Text className="text-start text-xl font-bold text-foreground">{label}</Text>

      <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 50 }} width={chartWidth}>
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
              fill: ({ datum }) => datum.color || color || "black",
              fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.8),
              stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
              strokeWidth: 2,
            },
          }}
          barRatio={0.5}
          alignment="middle"
          // barWidth={({ index }) => 30}
          scale={{ x: "linear" }}
          labels={({ datum }) => (datum.y > 0 ? datum.y.toFixed(0) : "")}
          animate={{
            onLoad: { duration: 500 },
          }}
          data={data}
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
                  console.log(props.datum);
                  setSelectedSlice(selectedSlice === props.datum.x ? null : props.datum.x);
                  onDayPress && onDayPress({ dateString: props.datum.item.date });
                },
              },
            },
          ]}
        />
      </VictoryChart>
    </View>
  );
}
