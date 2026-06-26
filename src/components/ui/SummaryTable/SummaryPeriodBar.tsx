/**
 * SummaryPeriodBar — period-type segmented control (monthly/quarterly/yearly), a
 * compact period-count stepper (user-configurable, default 3), and a refresh
 * action. Replaces the legacy PeriodSelector; no hardcoded hex (the refresh icon
 * uses the primary token via IconButton).
 */
import { View } from "react-native";

import { IconButton } from "../IconButton";
import { SegmentedControl } from "../SegmentedControl";
import { Text } from "../Text";
import { TimePeriod } from "./types";

export interface SummaryPeriodBarProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (value: TimePeriod) => void;
  periodCount: number;
  onPeriodCountChange: (count: number) => void;
  onRefresh: () => void;
  minCount?: number;
  maxCount?: number;
}

const SEGMENTS = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

export function SummaryPeriodBar({
  timePeriod,
  onTimePeriodChange,
  periodCount,
  onPeriodCountChange,
  onRefresh,
  minCount = 2,
  maxCount = 6,
}: SummaryPeriodBarProps) {
  return (
    <View className="gap-2 px-4 py-2">
      <SegmentedControl
        options={SEGMENTS}
        value={timePeriod}
        onChange={value => onTimePeriodChange(value as TimePeriod)}
        testID="summary-period-segments"
      />
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Text variant="caption">Periods</Text>
          <IconButton
            icon="Minus"
            variant="surface"
            size="xs"
            accessibilityLabel="Fewer periods"
            disabled={periodCount <= minCount}
            onPress={() => onPeriodCountChange(Math.max(minCount, periodCount - 1))}
            testID="summary-period-minus"
          />
          <Text className="w-6 text-center font-sans-semibold text-body" testID="summary-period-count">
            {periodCount}
          </Text>
          <IconButton
            icon="Plus"
            variant="surface"
            size="xs"
            accessibilityLabel="More periods"
            disabled={periodCount >= maxCount}
            onPress={() => onPeriodCountChange(Math.min(maxCount, periodCount + 1))}
            testID="summary-period-plus"
          />
        </View>
        <IconButton
          icon="RefreshCw"
          variant="ghost"
          accessibilityLabel="Refresh"
          onPress={onRefresh}
          testID="summary-refresh"
        />
      </View>
    </View>
  );
}
