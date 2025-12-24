import { LineChartPoint } from "@/src/types/components/Charts.types";
import { convertThemeToReactNativeColors } from "@/src/utils/theme.config";
import { FlatList, Platform, Text, View, useWindowDimensions } from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory-native";

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
        className={`w-full justify-center overflow-visible ${Platform.OS === "web" ? "items-center" : ""} ${showLegend ? "flex flex-row " : "flex flex-col-reverse"}`}
      >
        <View style={{ width: chartWidth }} className="overflow-visible">
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
                  data: { strokeWidth: 2, stroke: lineChartColor },
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
          </VictoryChart>
        </View>
        <View className="items-center justify-center">
          <Text className="font-bold text-md mb-2 px-2 text-foreground">Legend</Text>
          <FlatList
            data={data}
            keyExtractor={(item, index) => `${item.x}-${index}`}
            horizontal={showLegend ? false : true}
            style={{
              width: availableWidth * 0.9,
              height: showLegend ? chartHeight * 0.5 : "auto",
            }}
            className="custom-scrollbar"
            initialNumToRender={5}
            contentContainerClassName={`justify-center ${!showLegend ? "flex flex-wrap px-5" : ""}`}
            renderItem={({ item, index }) => (
              <View className="flex-row gap-3 justify-center items-center me-2 my-1">
                <View
                  style={{ width: 10, height: 10, backgroundColor: index < colors.length ? colors[index] : "red" }}
                />
                <Text className="text-foreground text-center">
                  {showLegend
                    ? `${item.x}: $${item.y.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : `${item.x}\n$${item.y.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </>
  );
}
