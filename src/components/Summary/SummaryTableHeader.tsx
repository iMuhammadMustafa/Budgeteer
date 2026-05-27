import { ScrollView, Text, View } from "react-native";

export interface PeriodData {
  label: string;
  start: string;
  end: string;
  isCurrent: boolean;
}
export default function SummaryTableHeader({
  periods,
  columnWidth,
  headerScrollRef,
}: {
  periods: PeriodData[];
  columnWidth: number;
  headerScrollRef: React.RefObject<ScrollView | null>;
}) {
  return (
    <View
      className="flex-row bg-surface-elevated border-b border-border-default shadow-sm z-20"
      style={{ elevation: 3 }}
    >
      <View
        style={{ width: columnWidth }}
        className="py-3 px-4 border-r border-border-default/40 justify-center items-center"
      >
        <Text className="font-bold text-xs text-foreground tracking-wide uppercase opacity-80 text-center">
          Category
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={headerScrollRef}
        scrollEnabled={false}
        className="flex-1"
      >
        {periods.map((period, index) => (
          <View key={index} style={{ width: columnWidth }} className="px-2 py-3 justify-center">
            <Text className="font-bold text-xs text-foreground text-center" numberOfLines={2}>
              {period.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
