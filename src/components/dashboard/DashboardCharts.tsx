/**
 * DashboardCharts — renders the dashboard's charts (new ui/charts) by mapping the
 * shared `buildDashboardChartConfigs` descriptor list into ChartCards, two across
 * on wide screens. The Calendar heatmap is pulled out of the grid and rendered
 * alone, full-width, at the bottom (its own nav/swipe makes it awkward paired next
 * to another card); `recentTransactionsSlot` takes the Calendar's old spot next to
 * Week's Expenses, stretched to the same row height as its sibling ChartCard.
 * Replaces the legacy `@/src/components/Charts/DashboardCharts`.
 */
import { memo, useState, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { ChartCard } from "@/src/components/ui";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import { DashboardViewSelectionType } from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import CalendarSummaryPanel from "./CalendarSummaryPanel";
import { buildDashboardChartConfigs, type DashboardChartsProps } from "./dashboardChartConfigs";

function DashboardCharts({
  recentTransactionsSlot,
  ...chartProps
}: DashboardChartsProps & { recentTransactionsSlot?: ReactNode }) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const fmtMoney = (n: number) => formatCurrency(n, false);

  // Animate the charts' entry only on the first mount. Subsequent renders (period
  // changes swapping in fresh data) pass `animated={false}` so the 6 charts update
  // their bars/lines in place instead of replaying their grow/draw-on animations.
  // Animate the charts' entry once per MOUNT. This stays `true` for the component's
  // life: the charts run their grow/draw-on animation when they mount, then in-place
  // data updates on a period change leave them mounted (grow already settled at 1),
  // so values jump without replaying. A genuine remount re-animates, as intended.
  const [animated] = useState(true);

  const configs = buildDashboardChartConfigs(chartProps, colors, fmtMoney, animated);

  const calendarConfig = configs.find(c => c.key === "calendar");
  const weekConfig = configs.find(c => c.key === "week");
  const restConfigs = configs.filter(c => c.key !== "calendar" && c.key !== "week");

  // `flexBasis:0` (a length, not `flex:1`'s `0%`) + `minWidth:0` + `overflow:hidden` forces equal
  // columns regardless of a chart's intrinsic content width. Rows of two (not one flex-wrap row)
  // keep pairing deterministic; `gap-3` matches the stat row's gap so columns line up with it too.
  const cell = isWide
    ? ({ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, overflow: "hidden" } as const)
    : ({ width: "100%" } as const);

  // Flex sizing must apply to a bare wrapper, not the padded ChartCard itself — a padded flex
  // child folds its padding into its border-box size and ends up narrower than a bare sibling.
  const wrapCell = (key: string, node: ReactNode) => (
    <View key={key} style={cell}>
      {node}
    </View>
  );

  const chartCell = (c: (typeof configs)[number]) =>
    wrapCell(
      c.key,
      <ChartCard
        title={c.title}
        period={c.period}
        loading={c.loading}
        onDetails={c.onDetails}
        className="my-0 h-full"
        testID={`chart-card-${c.key}`}
      >
        {c.node}
      </ChartCard>,
    );

  // Ordered cells: Week's Expenses, Recent Transactions, then the remaining charts.
  const cells: ReactNode[] = [];
  if (weekConfig) cells.push(chartCell(weekConfig));
  if (recentTransactionsSlot) cells.push(wrapCell("recent", recentTransactionsSlot));
  restConfigs.forEach(c => cells.push(chartCell(c)));

  // Wide: chunk into rows of two. Narrow: a single stacked column.
  const rows: ReactNode[][] = [];
  if (isWide) {
    for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));
  } else {
    cells.forEach(c => rows.push([c]));
  }

  return (
    <View className="gap-3">
      {rows.map((row, i) => (
        <View key={i} className="flex-row items-stretch gap-3">
          {row}
        </View>
      ))}
      {calendarConfig ? (
        isWide && chartProps.calendarSummary ? (
          // Wide: pair the calendar with a month-summary panel so it stops stretching the full width.
          <View className="flex-row items-stretch gap-3">
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
              <ChartCard
                title={calendarConfig.title}
                loading={calendarConfig.loading}
                bodyHeight="auto"
                className="my-0 h-full"
                testID={`chart-card-${calendarConfig.key}`}
              >
                {calendarConfig.node}
              </ChartCard>
            </View>
            <View style={{ width: 300 }}>
              <CalendarSummaryPanel
                className="my-0 h-full"
                summary={chartProps.calendarSummary}
                monthLabel={chartProps.periodControls.calendar.label}
                fmtMoney={fmtMoney}
                onDayPress={ds => chartProps.handleDayPress({ dateString: ds }, DashboardViewSelectionType.CALENDAR)}
              />
            </View>
          </View>
        ) : (
          <ChartCard
            title={calendarConfig.title}
            loading={calendarConfig.loading}
            bodyHeight="auto"
            className="my-0"
            testID={`chart-card-${calendarConfig.key}`}
          >
            {calendarConfig.node}
          </ChartCard>
        )
      ) : null}
    </View>
  );
}

export default memo(DashboardCharts);
