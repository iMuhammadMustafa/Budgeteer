import { DoubleBarPoint } from "@/src/types/components/Charts.types";
import { useMemo, useState } from "react";
import { Text, useWindowDimensions } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLabel, VictoryLegend, VictoryTheme } from "victory-native";
import { DoubleBarEmptyState } from "./ChartEmptyState";

export default function DoubleBar({
  data,
  label,
  onBarPress,
  highlightedBar,
}: {
  data: DoubleBarPoint[];
  label: string;
  onBarPress?: (item: DoubleBarPoint, barKey: "barOne" | "barTwo") => void;
  highlightedBar?: string;
}) {
  const { width } = useWindowDimensions();
  const [selectedSlice, setSelectedSlice] = useState<string | null>(highlightedBar || null);

  const chartWidth = Math.min(width * 0.95, 600); // Use 95% of width or max 600
  const chartHeight = chartWidth * 0.75;

  const dataLength = data.length || 1;
  const padding = { top: 40, bottom: 50, left: 50, right: 20 };
  const usableWidth = chartWidth - padding.left - padding.right;

  // Calculate dynamic dimensions for responsive and robust rendering
  const { barWidth, offset, domainPadding } = useMemo(() => {
    // Average horizontal space roughly allocated to each data group
    const spacePerGroup = usableWidth / dataLength;

    // The two bars shouldn't take up the entire group space.
    // Cap max width to 30px so bars aren't massive when data is sparse.
    const calculatedBarWidth = Math.max(4, Math.min(spacePerGroup * 0.35, 30));

    // Optional: If there's sparse data, add large domain padding to center them.
    let calculatedDomainPadding = calculatedBarWidth * 2;
    if (dataLength === 1) calculatedDomainPadding = usableWidth / 3;
    else if (dataLength === 2) calculatedDomainPadding = usableWidth / 4;
    else if (dataLength <= 4) calculatedDomainPadding = usableWidth / 6;

    return {
      barWidth: calculatedBarWidth,
      offset: calculatedBarWidth, // Spacing between the paired bars in VictoryGroup
      domainPadding: calculatedDomainPadding,
    };
  }, [dataLength, usableWidth]);

  const isEmpty = !data || data.length === 0 || data.every(d => d.barOne.value === 0 && d.barTwo.value === 0);
  if (isEmpty) {
    return <DoubleBarEmptyState label={label} />;
  }

  return (
    <>
      <Text className="text-center text-xl font-bold text-foreground">{label}</Text>
      <VictoryChart
        width={chartWidth * (width > 700 ? 1.75 : 1)}
        height={chartHeight}
        domainPadding={{ x: domainPadding, y: 10 }}
        theme={VictoryTheme.material}
        padding={padding}
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
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryGroup offset={offset + 5}>
          <VictoryBar
            barWidth={barWidth}
            data={data}
            x="x"
            y={datum => datum.barOne.value}
            labels={({ datum }) => datum.barOne.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            labelComponent={
              <VictoryLabel
                angle={(width < 500 && dataLength > 6) ? 45 : 0}
              />
            }
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
                  onPress: (_, props) => {
                    const newSelectedSlice = selectedSlice === props.datum.x ? null : props.datum.x;

                    if (onBarPress && newSelectedSlice) {
                      const selectedBar = data.find(item => item.x === newSelectedSlice);
                      if (selectedBar) {
                        onBarPress(selectedBar, "barOne");
                      }
                    }
                    setSelectedSlice(newSelectedSlice);
                  },
                },
              },
            ]}
          />
          <VictoryBar
            barWidth={barWidth}
            data={data}
            x="x"
            y={datum => datum.barTwo.value}
            labels={({ datum }) =>
              datum.barTwo.value.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })
            }
            labelComponent={
              <VictoryLabel
                angle={(width < 500 && dataLength > 6) ? 45 : 0}
              />
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
                  onPress: (_, props) => {
                    const newSelectedSlice = selectedSlice === props.datum.x ? null : props.datum.x;

                    if (onBarPress && newSelectedSlice) {
                      const selectedBar = data.find(item => item.x === newSelectedSlice);
                      if (selectedBar) {
                        onBarPress(selectedBar, "barTwo");
                      }
                    }
                    setSelectedSlice(newSelectedSlice);
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
