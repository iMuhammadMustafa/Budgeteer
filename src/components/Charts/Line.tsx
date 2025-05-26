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
  VictoryLegend,
  VictoryVoronoiContainer,
  VictoryGroup,
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
        <VictoryGroup data={data} color={lineChartColor}>
          <VictoryLine
            style={{
              data: { strokeWidth: 2 }, // Color is inherited from VictoryGroup
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 500 },
            }}
          />
          <VictoryScatter
            size={({ active }: { active?: boolean }) => (active ? 8 : 3)}
            style={{
              data: { fill: lineChartColor }, // Keep fill for scatter points if different from line
            }}
          />
        </VictoryGroup>
        <VictoryLegend
          orientation="horizontal"
          x={chartWidth / 5}
          y={chartHeight - 30}
          data={data.map((point, index) => ({
            name: `${point.x}: ${point.y}`,
          }))}
        />
      </VictoryChart>
    </View>
  );
}
