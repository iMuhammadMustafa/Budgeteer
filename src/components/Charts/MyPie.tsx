import { useTheme } from "@/src/providers/ThemeProvider";
import { PieData, PieProps } from "@/src/types/components/Charts.types";
import { useState } from "react";
import { Platform, Text, useWindowDimensions, View } from "react-native";
import { VictoryContainer, VictoryLabel, VictoryPie, VictoryTheme } from "victory-native";
import { PieEmptyState } from "./ChartEmptyState";
import ChartLegend from "./ChartLegend";

export default function MyPie({
  data = [],
  label = "Chart",
  maxItemsOnChart = 10,
  onPiePress,
  highlightedSlice,
}: PieProps & {
  onPiePress?: (item: PieData) => void;
  highlightedSlice?: string;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [selectedSlice, setSelectedSlice] = useState<PieData | null>(
    highlightedSlice ? data.find(item => item.x === highlightedSlice) || null : null,
  );
  const chartWidth = Math.min(width, 600);
  const chartHeight = Math.min(width, 600);

  const showLegend = width > 600 * 1.5;
  const availableWidth = showLegend ? width * 0.25 : chartWidth;
  const isEmpty = !data || data.length === 0 || data.every(d => d.y === 0);
  if (isEmpty) {
    return <PieEmptyState label={label} />;
  }

  const totalValue = data.reduce((acc, item) => acc + item.y, 0);

  // Combine smaller items into 'Other' if there are more than 5
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
    "#87CEEB",
    "#9370DB",
    "#FF6347",
    "#40E0D0",
    "#D2691E",
    "#6495ED",
    "#FF4500",
    "#2E8B57",
    "#1E90FF",
  ];
  const sortedData = [...data].filter(item => item.y > 0).sort((a, b) => b.y - a.y);
  const topItems = sortedData.slice(0, maxItemsOnChart); // Top 5 items
  const otherItems = sortedData.slice(maxItemsOnChart); // Remaining items
  const otherTotal = otherItems.reduce((sum, item) => sum + item.y, 0);
  const combinedData =
    data.length > maxItemsOnChart ? [...topItems, { x: "Rest..", y: otherTotal.toFixed(2) }] : sortedData;
  const processedData = combinedData.map((item, index) => ({
    ...{ ...item, color: colors[index % colors.length] },
    y: Number(item.y),
  }));

  return (
    <>
      <Text className={`text-center text-xl font-bold text-foreground`}>{label}</Text>

      <View
        className={`w-full justify-center overflow-visible ${Platform.OS === "web" ? "items-center" : ""} ${showLegend ? "flex flex-row " : "flex flex-col-reverse"}`}
      >
        <View style={{ width: chartWidth }} className="overflow-visible">
          <VictoryContainer
            width={chartWidth * 1.25}
            height={chartHeight}
            theme={VictoryTheme.material}
            disableContainerEvents
            style={{ overflow: "visible" }}
          >
            <VictoryPie
              standalone={false}
              width={chartWidth * 0.7}
              height={chartHeight * 0.7}
              data={processedData}
              colorScale={colors}
              theme={VictoryTheme.material}
              innerRadius={Platform.OS === "web" ? chartWidth * 0.18 : undefined}
              labelRadius={d => (Platform.OS === "web" ? chartWidth * 0.28 : Number(d.innerRadius) + 120)}
              padAngle={1}
              origin={{ x: chartWidth * 0.5, y: chartHeight * 0.45 }}
              style={{
                parent: { overflow: "visible", backgroundColor: "red" },

                labels: { fontSize: 15, fontWeight: "bold" },
                data: {
                  backgroundColor: "red",
                  fillOpacity: ({ datum }) => (selectedSlice?.x === datum.x ? 0.9 : 0.7),
                  stroke: ({ datum }) => (selectedSlice?.x === datum.x ? "black" : "none"),
                  strokeWidth: 2,
                },
              }}
              labelPlacement="parallel"
              labels={({ datum }) => {
                const name = datum.x;
                const percentage = ((datum.y / totalValue) * 100).toFixed(0);
                const label = Platform.OS === "web" ? `${name}\n${percentage}%` : `${name}`;
                return label;
              }}
              labelComponent={<VictoryLabel />}
              events={[
                {
                  target: "data",
                  eventHandlers: {
                    onPress: (_, props) => {
                      const newSelectedSlice = selectedSlice?.x === props.datum.x ? null : props.datum;
                      setSelectedSlice(newSelectedSlice);

                      // Call the onPiePress callback if provided
                      if (onPiePress && newSelectedSlice) {
                        onPiePress(newSelectedSlice);
                      }
                    },
                  },
                },
              ]}
            />
            {selectedSlice !== null ? (
              <VictoryLabel
                backgroundPadding={10}
                backgroundStyle={
                  Platform.OS !== "web"
                    ? {
                      fill: "white",
                      fillOpacity: 0.7,
                      stroke: "black",
                      strokeWidth: 2,
                    }
                    : undefined
                }
                textAnchor="middle"
                verticalAnchor="middle"
                x={chartWidth * 0.5}
                y={chartHeight * 0.45}
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  fill: theme === "light" ? "black" : Platform.OS === "web" ? "white" : "black",
                }}
                text={
                  selectedSlice !== null
                    ? `${selectedSlice.x}: ${(((selectedSlice.y || 0) / totalValue) * 100).toFixed(0)}%
                  \n${selectedSlice?.y.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}`
                    : ""
                }
                events={
                  Platform.OS === "web"
                    ? ({ onClick: () => setSelectedSlice(null) } as any)
                    : ({ onPress: () => setSelectedSlice(null) } as any)
                }
              />
            ) : (
              <></>
            )}
          </VictoryContainer>
        </View>
        <ChartLegend showLegend={showLegend} availableWidth={availableWidth} chartWidth={chartWidth} chartHeight={chartHeight} data={processedData} colors={colors} totalValue={totalValue} />
      </View>
    </>
  );
}
