import React, { useState } from "react";
import { View, useWindowDimensions, Text, Platform } from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
} from "victory-native";
import { LineChartPoint } from "@/src/types/components/Charts.types";
import { convertThemeToReactNativeColors } from "@/src/utils/theme.config";

// Define props for the Line chart component
export type LineProps = {
  data: LineChartPoint[];
  label: string;
  color?: string; // Optional: color for the line and points
  hideY?: boolean; // Optional: to hide Y-axis
};

export default function Line({ data, label, color, hideY }: LineProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width * 0.95, 600); // Use 95% of width or max 600
  const chartHeight = chartWidth * 0.6; // Adjust height relative to width

  // Ensure data is not empty and has at least two points for a line
  if (!data || data.length < 2) {
    return (
      <View
        className="p-2 m-auto bg-card my-2 rounded-md border border-muted items-center justify-center"
        style={{ width: chartWidth, height: chartHeight }}
      >
        <Text className="text-foreground">{label}</Text>
        <Text className="text-muted-foreground">Not enough data to display chart.</Text>
      </View>
    );
  }

  // Get theme colors. Assuming 'light' mode for now.
  // TODO: Replace 'light' with a dynamic theme mode from context if available
  const themeColors = convertThemeToReactNativeColors("light").colors;

  const lineChartColor = color || themeColors.primary;

  return (
    <View className="p-2 m-auto bg-card my-2 rounded-md border border-muted">
      <Text className="text-start text-xl font-bold text-foreground mb-2">{label}</Text>

      <VictoryChart
        theme={VictoryTheme.material}
        width={chartWidth}
        height={chartHeight}
        domainPadding={{ x: 20, y: 20 }}
        padding={{ top: 20, bottom: 50, left: 60, right: 30 }} // Adjust padding
      >
        <VictoryAxis
          style={{
            grid: { stroke: themeColors.border, strokeDasharray: "4" },
            axis: { stroke: themeColors.border },
            ticks: { stroke: themeColors.border, size: 5 },
            tickLabels: { fontSize: 10, padding: 5 },
          }}
          // For X-axis, if labels are long or numerous, consider rotating them
          tickLabelComponent={
            Platform.OS === "web" ? <VictoryLabel /> : <VictoryLabel dy={10} angle={-30} textAnchor="end" />
          }
        />
        {!hideY && (
          <VictoryAxis
            dependentAxis
            style={{
              grid: { stroke: themeColors.border, strokeDasharray: "4" },
              axis: { stroke: themeColors.border },
              ticks: { stroke: themeColors.border, size: 5 },
              tickLabels: { fontSize: 10, padding: 5 },
            }}
            // Format Y-axis labels if needed (e.g., for currency)
            tickFormat={t => (typeof t === "number" ? `${t / 1000}k` : t)}
          />
        )}
        <VictoryLine
          data={data}
          style={{
            data: { stroke: lineChartColor, strokeWidth: 2 },
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
        />
        <VictoryScatter
          data={data}
          size={4}
          style={{
            data: { fill: lineChartColor },
          }}
          labels={({ datum }) =>
            datum.y.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
          } // Show Y value on hover/press
          labelComponent={
            <VictoryTooltip
              cornerRadius={3}
              flyoutStyle={{ fill: themeColors.card, stroke: themeColors.border }}
              style={{ fill: themeColors.text, fontSize: 10 }}
              dx={5}
              dy={-5}
            />
          }
        />
      </VictoryChart>
    </View>
  );
}
