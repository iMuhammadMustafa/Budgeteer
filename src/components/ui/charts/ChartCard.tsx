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
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import Pulse from "@/src/components/elements/Pulse";
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
  /** While the chart's data is refetching (e.g. a period change), cover the body with a pulsing
   * skeleton. It shares the body's fixed footprint, so it swaps in without shifting the card —
   * unlike a header spinner, which grew the header row and jolted the chart below. */
  loading?: boolean;
  /** When set, show a subtle "Details ›" link in the header that drills into this chart's
   * details page for the whole period. Omitted → no link (non-drillable cards stay clean). */
  onDetails?: () => void;
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
  onDetails,
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
        {onDetails ? (
          <Pressable
            onPress={onDetails}
            className="flex-row items-center gap-0.5 active:opacity-60"
            accessibilityLabel={`View ${title} details`}
            testID={`${testID}-details`}
          >
            <Text variant="overline" className="text-primary">
              Details
            </Text>
            <MyIcon name="ChevronRight" size={13} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {/* A fixed-height body gives fill-height charts (BarChart's `fillHeight`, etc.) a stable
          box to grow into and keeps every card the same height; `"auto"` falls back to the old
          flex-1 grow-to-fill behaviour for cards that manage their own height (e.g. Calendar). */}
      <View className={cn("relative", auto && "flex-1")} style={auto ? undefined : { height: bodyHeight }}>
        {children}
        {loading ? <ChartBodySkeleton testID={`${testID}-loading`} /> : null}
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

/**
 * ChartBodySkeleton — a pulsing bar placeholder that absolutely fills the chart body while
 * data refetches. Because it's `absolute inset-0` over the body's fixed footprint, it covers
 * the stale chart without changing the card's size — no layout shift when it swaps in or out.
 */
function ChartBodySkeleton({ testID }: { testID?: string }) {
  const { colors } = useTheme();
  // Fractions of the body height — a generic "bar chart" silhouette that reads as loading for
  // any chart type (bar/line/donut) without needing to know which one is underneath.
  const bars = [0.5, 0.72, 0.4, 0.88, 0.58, 0.78, 0.48];
  return (
    <View className="absolute inset-0 bg-surface" pointerEvents="none" testID={testID}>
      <Pulse style={{ flex: 1 }}>
        <View className="flex-1 flex-row items-end justify-center gap-3 px-1 pb-2">
          {bars.map((h, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                maxWidth: 36,
                height: `${h * 100}%`,
                backgroundColor: colors.border,
                borderRadius: 6,
              }}
            />
          ))}
        </View>
      </Pulse>
    </View>
  );
}

export const ChartCard = memo(ChartCardInner);
