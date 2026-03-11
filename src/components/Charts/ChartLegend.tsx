import { LineChartPoint } from "@/src/types/components/Charts.types";
import { ScrollView, Text, View } from "react-native";

export default function ChartLegend({ showLegend, availableWidth, chartWidth, chartHeight, data, colors, totalValue }: { showLegend: boolean, availableWidth: number, chartWidth: number, chartHeight: number, data: LineChartPoint[], colors: string[], totalValue?: number }) {
    return <View className="items-center justify-center mt-2 px-2 pb-2">
        <Text className="font-bold text-md mb-2 text-foreground">Legend</Text>
        <ScrollView
            className="custom-scrollbar"
            horizontal={!showLegend}
            contentContainerClassName={`items-center ${showLegend ? "flex-col" : "flex-row px-4"}`}
            style={{
                width: showLegend ? availableWidth * 0.9 : chartWidth,
                maxHeight: showLegend ? chartHeight * 0.8 : 60
            }}
            showsVerticalScrollIndicator={showLegend}
            showsHorizontalScrollIndicator={!showLegend}
            nestedScrollEnabled={true}
        >
            {data.map((item, index) => (
                <View
                    key={`${item.x}-${index}`}
                    className={`flex-row gap-2 items-center ${showLegend ? "my-1" : "mx-2"}`}
                >
                    <View
                        style={{ width: 10, height: 10, backgroundColor: index < colors.length ? colors[index] : "red", borderRadius: 2 }} />
                    <Text className="text-foreground text-center">
                        {showLegend
                            ? `${item.x}: $${item.y.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })} ${totalValue ? `(${((item.y / totalValue) * 100).toFixed(0)}%)` : ""}`
                            : `${item.x}\n$${item.y.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })} ${totalValue ? `(${((item.y / totalValue) * 100).toFixed(0)}%)` : ""}`}
                    </Text>
                </View>
            ))}
        </ScrollView>
    </View>;
}