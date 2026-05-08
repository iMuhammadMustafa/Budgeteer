import { LineChartPoint } from "@/src/types/components/Charts.types";
import { ScrollView, View } from "react-native";
import ThemedText from "../elements/ThemedText";

export default function ChartLegend({ showLegend: verticalLegend, availableWidth, chartWidth, chartHeight, data, colors, totalValue }: { showLegend: boolean, availableWidth: number, chartWidth: number, chartHeight: number, data: LineChartPoint[], colors: string[], totalValue?: number }) {
    return <View className=" justify-center mt-2 px-2 pb-2">
        <ThemedText variant="subheading" className="mb-2">Legend</ThemedText>
        <ScrollView
            className="custom-scrollbar"
            horizontal={!verticalLegend}
            contentContainerClassName={` ${verticalLegend ? "flex-col" : "flex-row px-4"}`}
            style={{
                width: verticalLegend ? availableWidth * 0.9 : chartWidth,
                maxHeight: verticalLegend ? chartHeight * 0.8 : 60,
            }}
            showsVerticalScrollIndicator={verticalLegend}
            showsHorizontalScrollIndicator={!verticalLegend}
            nestedScrollEnabled={true}
        >
            {data.map((item, index) => (
                <View
                    key={`${item.x}-${index}`}
                    className={`flex-row gap-2 items-center ${verticalLegend ? "my-1" : "mx-2"}`}
                >
                    <View
                        style={{ width: 10, height: 10, backgroundColor: index < colors.length ? colors[index] : "red", borderRadius: 2 }} />
                    <ThemedText className="text-center">
                        {verticalLegend
                            ? `${item.x}: $${item.y.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })} ${totalValue ? `(${((item.y / totalValue) * 100).toFixed(0)}%)` : ""}`
                            : `${item.x}\n$${item.y.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })} ${totalValue ? `(${((item.y / totalValue) * 100).toFixed(0)}%)` : ""}`}
                    </ThemedText>
                </View>
            ))}
        </ScrollView>
    </View>;
}