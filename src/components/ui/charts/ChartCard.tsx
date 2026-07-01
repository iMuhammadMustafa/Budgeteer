/**
 * ChartCard — Sage Paper container for a dashboard chart. A Card with a title
 * overline, the chart body, and an optional period bar (prev · label · next).
 * Replaces the legacy ChartsContainer + PeriodControls.
 *
 *   <ChartCard title="Week's Expenses" period={{ label, onPrev, onNext }}>
 *     <BarChart data={...} />
 *   </ChartCard>
 */
import { type ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { Card } from "../Card";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { cn } from "../utils/cn";

export interface ChartCardPeriod {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export interface ChartCardProps {
  title: string;
  children: ReactNode;
  period?: ChartCardPeriod;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ChartCard({ title, children, period, className = "", style, testID = "chart-card" }: ChartCardProps) {
  return (
    <Card className={cn("my-1.5 gap-3", className)} style={style} testID={testID}>
      <Text variant="overline">{title}</Text>
      {/* flex-1 so a chart that knows how to fill its space (e.g. BarChart's `fillHeight`) has
          real room to grow into when a sibling card (e.g. Recent Transactions) stretches this
          card taller than the chart's own natural content height. */}
      <View className="flex-1">{children}</View>
      {period && (
        <View className="mt-auto flex-row items-center justify-between" testID={`${testID}-period`}>
          <IconButton
            icon="ChevronLeft"
            variant="ghost"
            size="sm"
            onPress={period.onPrev}
            accessibilityLabel="Previous period"
            testID={`${testID}-prev`}
          />
          <Text variant="label" className="text-ink">
            {period.label}
          </Text>
          <IconButton
            icon="ChevronRight"
            variant="ghost"
            size="sm"
            onPress={period.onNext}
            accessibilityLabel="Next period"
            testID={`${testID}-next`}
          />
        </View>
      )}
    </Card>
  );
}
