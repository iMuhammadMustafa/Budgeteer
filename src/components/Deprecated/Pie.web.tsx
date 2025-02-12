import React, { Children, useState } from "react";
import { View, Text, useWindowDimensions, ScrollView, Pressable } from "react-native";
import { VictoryPie, VictoryLegend, VictoryContainer, VictoryLabel, VictoryTheme } from "victory-native";

export default function PieChartWeb({ data }) {
  const { width } = useWindowDimensions();
  const [selectedSlice, setSelectedSlice] = useState(null);
  const chartWidth = Math.min(width, 600);
  const chartHeight = chartWidth;

  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#996666"];

  const sortedData = [...data].sort((a, b) => b.y - a.y);
  const topItems = sortedData.slice(0, 5); // Top 5 items
  const otherItems = sortedData.slice(5); // Remaining items

  // Combine smaller items into 'Other' if there are more than 5
  const otherTotal = otherItems.reduce((sum, item) => sum + item.y, 0);
  const combinedData = [...topItems, { x: "Rest..", y: otherTotal.toFixed(2), originalItems: otherItems }];
  const processedData = combinedData.map((item, index) => ({
    ...item,
    y: Number(item.y),
    color: colors[index % colors.length],
  }));

  const totalValue = processedData.reduce((sum, item) => sum + item.y, 0);

  return (
    <View className="flex flex-row justify-center items-center w-full flex-grow-0">
      <View style={{ width: chartWidth }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" }}>Categories</Text>
        <VictoryContainer width={chartWidth} height={chartHeight} theme={VictoryTheme.material}>
          <VictoryPie
            standalone={false}
            width={chartWidth * 0.7}
            height={chartHeight * 0.7}
            data={processedData}
            colorScale={colors}
            // theme={VictoryTheme.material}
            innerRadius={chartWidth * 0.15}
            // padAngle={2}
            origin={{ x: chartWidth * 0.5, y: chartHeight * 0.5 }}
            labelRadius={({ innerRadius }) => innerRadius + (chartWidth * 0.4 - innerRadius) / 2}
            style={{
              parent: { overflow: "visible" },
              labels: { fontSize: 15, fontWeight: "bold" },
              data: {
                fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.7),
                stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
                strokeWidth: 2,
              },
            }}
            labelPlacement="parallel"
            labels={({ datum }) => `${datum.x}\n${((datum.y / totalValue) * 100).toFixed(1)}%`}
            labelComponent={<VictoryLabel />}
            events={[
              {
                target: "data",
                eventHandlers: {
                  onPress: (_, props) => {
                    setSelectedSlice(selectedSlice === props.datum.x ? null : props.datum.x);
                  },
                },
              },
            ]}
          />

          {selectedSlice !== null && (
            <VictoryLabel
              textAnchor="middle"
              verticalAnchor="middle"
              x={chartWidth * 0.5}
              y={chartHeight * 0.5}
              style={{ fontSize: 14, fontWeight: "bold" }}
              text={`${selectedSlice}: $${processedData.find(item => item.x === selectedSlice).y}`}
            />
          )}
        </VictoryContainer>
      </View>
      <ScrollView style={{ maxWidth: "50%", flexGrow: 0 }} nestedScrollEnabled={true} className="custom-scrollbar">
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Legend</Text>
        {sortedData.map((item, index) => (
          <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5, flex: 1 }}>
            <View style={{ width: 10, height: 10, backgroundColor: colors[index % colors.length], marginRight: 5 }} />
            <Text>{`${item.x} - $${item.y.toFixed(2)} (${((item.y / totalValue) * 100).toFixed(1)}%)`}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
