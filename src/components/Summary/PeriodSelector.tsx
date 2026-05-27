import { Text, View } from "react-native";
import Button from "../elements/Button";

export type TimePeriod = "monthly" | "quarterly" | "yearly";

export default function PeriodSelector({
  timePeriod,
  setTimePeriod,
  onRefresh,
}: {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  onRefresh: () => void;
}) {
  return (
    <View
      className="flex-row items-center gap-2 bg-surface px-4 py-2.5 border-b border-border-default/40 z-10"
      style={{
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      }}
    >
      <View className="flex-row flex-1 bg-surface-elevated/80 rounded-xl p-1 border border-border-default/30">
        {(["monthly", "quarterly", "yearly"] as TimePeriod[]).map(period => (
          <Button
            key={period}
            variant={timePeriod === period ? "primary" : "ghost"}
            size="sm"
            hapticFeedback="selection"
            onPress={() => setTimePeriod(period)}
            className={`flex-1 py-1.5 px-3 rounded-lg items-center ${timePeriod === period ? "shadow-sm" : ""}`}
            testID={`btn-period-${period}`}
          >
            <Text
              className={`${timePeriod === period ? "text-primary-foreground font-bold" : "text-muted-foreground font-medium"} capitalize text-xs`}
            >
              {period}
            </Text>
          </Button>
        ))}
      </View>
      <Button
        variant="ghost"
        size="icon"
        onPress={onRefresh}
        testID="btn-summary-refresh"
        className="bg-surface-elevated rounded-full w-8 h-8 items-center justify-center border border-border-default/40"
        iconColor="#10b981"
        rightIcon="RefreshCcw"
        iconSize={20}
      />
    </View>
  );
}
