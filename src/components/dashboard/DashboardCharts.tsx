/**
 * DashboardCharts — renders the dashboard's charts (new ui/charts) by mapping the
 * shared `buildDashboardChartConfigs` descriptor list into ChartCards, two across
 * on wide screens. The Calendar heatmap is pulled out of the grid and rendered
 * alone, full-width, at the bottom (its own nav/swipe makes it awkward paired next
 * to another card); `recentTransactionsSlot` takes the Calendar's old spot next to
 * Week's Expenses, stretched to the same row height as its sibling ChartCard.
 * Replaces the legacy `@/src/components/Charts/DashboardCharts`.
 */
import { type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { ChartCard } from "@/src/components/ui";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import { buildDashboardChartConfigs, type DashboardChartsProps } from "./dashboardChartConfigs";

export default function DashboardCharts({
  recentTransactionsSlot,
  ...chartProps
}: DashboardChartsProps & { recentTransactionsSlot?: ReactNode }) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const configs = buildDashboardChartConfigs(chartProps, colors, n => formatCurrency(n, false));

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
      <ChartCard title={c.title} period={c.period} className="my-0 h-full" testID={`chart-card-${c.key}`}>
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
        <ChartCard
          title={calendarConfig.title}
          period={calendarConfig.period}
          className="my-0"
          testID={`chart-card-${calendarConfig.key}`}
        >
          {calendarConfig.node}
        </ChartCard>
      ) : null}
    </View>
  );
}
