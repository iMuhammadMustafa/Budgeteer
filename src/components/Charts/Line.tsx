import { LineChartPoint } from "@/src/types/components/Charts.types";
import { convertThemeToReactNativeColors } from "@/src/utils/theme.config";
import { Platform, Text, View, useWindowDimensions } from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory-native";
import { LineEmptyState } from "./ChartEmptyState";
import ChartLegend from "./ChartLegend";

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

  const showLegend = width > 600 * 1.5;
  const availableWidth = showLegend ? width * 0.25 : chartWidth;

  // Ensure data is not empty
  if (!data || data.length === 0) {
    return <LineEmptyState label={label} />;
  }

  // Show message for single data point (can't draw a line)
  const hasSinglePoint = data.length === 1;
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#996666",
    "#FF9F40",
    "#4DBD77",
    "#FFB6C1",
    "#F4A460",
    "#20B2AA",
  ];

  // Get theme colors. Assuming 'light' mode for now.
  // TODO: Replace 'light' with a dynamic theme mode from context if available
  const themeColors = convertThemeToReactNativeColors("light").colors;

  const lineChartColor = color || themeColors.primary;

  return (
    <>
      <Text className={`text-center text-xl font-bold text-foreground`}>{label}</Text>

      <View
        className={`w-full justify-center items-center ${showLegend ? "flex flex-row " : "flex flex-col-reverse"}`}
      >
        <View style={{ width: chartWidth, height: chartHeight }}>
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
                tickFormat={t => (typeof t === "number" ? `${Math.round(t / 1000)}k` : t)}
              />
            )}
            <VictoryGroup data={data} color={lineChartColor}>
              {!hasSinglePoint && (
                <VictoryLine
                  style={{
                    data: { strokeWidth: 2, stroke: lineChartColor },
                  }}
                  animate={
                    Platform.OS === "web"
                      ? { duration: 500, onLoad: { duration: 500 } }
                      : undefined
                  }
                />
              )}
              <VictoryScatter
                size={({ active }: { active?: boolean }) => (hasSinglePoint ? 8 : active ? 8 : 3)}
                style={{
                  data: { fill: lineChartColor },
                }}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>
        <ChartLegend showLegend={showLegend} availableWidth={availableWidth} chartWidth={chartWidth} chartHeight={chartHeight} data={data} colors={colors} />
      </View>
    </>
  );
}

