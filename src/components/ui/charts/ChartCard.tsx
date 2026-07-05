/**
 * ChartCard — Sage Paper container for a dashboard chart. A Card with a title
 * overline, the chart body, and an optional period bar (prev · label · next).
 * Replaces the legacy ChartsContainer + PeriodControls.
 *
 *   <ChartCard title="Week's Expenses" period={{ label, onPrev, onNext }}>
 *     <BarChart data={...} />
 *   </ChartCard>
 */
import { memo, type ReactNode } from "react";
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Card } from "../Card";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { cn } from "../utils/cn";

/**
 * Fixed height (px) for a chart card's body, so every card in the dashboard grid is
 * uniformly tall regardless of its chart's intrinsic content. This is what lets the
 * fill-height charts (Bar/DoubleBar/Line) and the vertically-centered Donut share one
 * footprint — and it stops a row from jumping height when a period change swaps in data
 * of a different shape. Cards that own their own sizing (e.g. the Calendar) pass
 * `bodyHeight="auto"` to opt out.
 */
export const CHART_BODY_HEIGHT = 320;

export interface ChartCardPeriod {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export interface ChartCardProps {
  title: string;
  children: ReactNode;
  period?: ChartCardPeriod;
  /** Body height in px (default `CHART_BODY_HEIGHT`), or `"auto"` to size to content. */
  bodyHeight?: number | "auto";
  /** Show a subtle spinner in the header while this chart's data is refetching (e.g. a period
   * change). The stale chart stays visible underneath, so this is non-blocking feedback. */
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function ChartCardInner({
  title,
  children,
  period,
  bodyHeight = CHART_BODY_HEIGHT,
  loading = false,
  className = "",
  style,
  testID = "chart-card",
}: ChartCardProps) {
  const { colors } = useTheme();
  const auto = bodyHeight === "auto";
  return (
    <Card className={cn("my-1.5 gap-2 p-5 pb-1", className)} style={style} testID={testID}>
      <View className="flex-row items-center justify-between">
        <Text variant="overline">{title}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.inkFaint} testID={`${testID}-loading`} />
        ) : null}
      </View>
      {/* A fixed-height body gives fill-height charts (BarChart's `fillHeight`, etc.) a stable
          box to grow into and keeps every card the same height; `"auto"` falls back to the old
          flex-1 grow-to-fill behaviour for cards that manage their own height (e.g. Calendar). */}
      <View className={cn(auto && "flex-1")} style={auto ? undefined : { height: bodyHeight }}>
        {children}
      </View>
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

export const ChartCard = memo(ChartCardInner);
