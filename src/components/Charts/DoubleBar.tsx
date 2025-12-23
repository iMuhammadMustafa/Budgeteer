import { DoubleBarPoint } from "@/src/types/components/Charts.types";
import { useMemo, useState } from "react";
import { Text, useWindowDimensions } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLegend, VictoryTheme } from "victory-native";

export default function NetEarningsChart({
  data,
  label,
  onBarPress,
  highlightedBar,
}: {
  data: DoubleBarPoint[];
  label: string;
  onBarPress?: (item: DoubleBarPoint) => void;
  highlightedBar?: string;
}) {
  const { width } = useWindowDimensions();

  const chartWidth = Math.min(width * 0.95, 600); // Use 95% of width or max 600
  const chartHeight = chartWidth * 0.75;

  const barWidth = 20; // A reasonable bar width
  const spaceBetweenBars = chartWidth / (data.length * 1.5); // Adjust the space based on the number of bars
  const offset = spaceBetweenBars - barWidth / 2;

  const [selectedSlice, setSelectedSlice] = useState<string | null>(highlightedBar || null);

  const calculateDomainPadding = useMemo(() => {
    const dataLength = data.length;
    if (dataLength <= 2) return 200;
    if (dataLength <= 5) return 100;
    if (dataLength <= 10) return 50;
    return Math.max(20, 500 / dataLength); // For larger datasets, use inverse relationship
  }, [data.length]);

  return (
    <>
      <Text className="text-center text-xl font-bold text-foreground">{label}</Text>
      <VictoryChart
        width={chartWidth * (width > 700 ? 1.7 : 1)}
        height={chartHeight}
        domainPadding={{ x: calculateDomainPadding, y: 10 }}
        theme={VictoryTheme.material}
        padding={{ top: 40, bottom: 50, left: 50, right: 20 }}
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
        <VictoryGroup offset={offset}>
          <VictoryBar
            data={data}
            x="x"
            y={data => data.barOne.value}
            labels={({ datum }) => datum.barOne.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            style={{
              data: {
                fill: ({ datum }) => datum.barOne.color || "black",
                fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.8),
                stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
                strokeWidth: 2,
              },
            }}
            animate={{
              onLoad: { duration: 500 },
            }}
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
                    const newSelectedSlice = selectedSlice === props.datum.x ? null : props.datum.x;
                    setSelectedSlice(newSelectedSlice);

                    // Call the onBarPress callback if provided
                    if (onBarPress && newSelectedSlice) {
                      const selectedBar = data.find(item => item.x === newSelectedSlice);
                      if (selectedBar) {
                        onBarPress(selectedBar);
                      }
                    }
                  },
                },
              },
            ]}
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
            style={{
              data: {
                fill: ({ datum }) => datum.barTwo.color || "black",
                fillOpacity: ({ datum }) => (selectedSlice === datum.x ? 0.9 : 0.8),
                stroke: ({ datum }) => (selectedSlice === datum.x ? "black" : "none"),
                strokeWidth: 2,
              },
            }}
            animate={{
              onLoad: { duration: 500 },
            }}
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
                    const newSelectedSlice = selectedSlice === props.datum.x ? null : props.datum.x;
                    setSelectedSlice(newSelectedSlice);

                    // Call the onBarPress callback if provided
                    if (onBarPress && newSelectedSlice) {
                      const selectedBar = data.find(item => item.x === newSelectedSlice);
                      if (selectedBar) {
                        onBarPress(selectedBar);
                      }
                    }
                  },
                },
              },
            ]}
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
    </>
  );
}
