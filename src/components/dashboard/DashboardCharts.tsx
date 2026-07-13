/**
 * DashboardCharts — renders the dashboard's charts (new ui/charts) by mapping the
 * shared `useDashboardChartConfigs` descriptor list into ChartCards, two across
 * on wide screens.
 */
import { memo } from "react";
import { useWindowDimensions, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { BREAKPOINT_DESKTOP, BREAKPOINT_MD } from "@/src/constants/layout";
import { DashboardChartsProps } from "@/src/types/pages/dashboard/DashboardConfig.Types";
import { ChartCard } from "@/src/components/ui";

import { useDashboardChartConfigs } from "./dashboardChartConfigs";

function DashboardCharts({ ...chartProps }: DashboardChartsProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT_MD;

  const configs = useDashboardChartConfigs(chartProps, colors);

  // `flexBasis:0` (a length, not `flex:1`'s `0%`) + `minWidth:0` + `overflow:hidden` forces equal
  // columns regardless of a chart's intrinsic content width. Rows of two (not one flex-wrap row)
  // keep pairing deterministic; `gap-3` matches the stat row's gap so columns line up with it too.
  const cell = isWide
    ? ({ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, overflow: "hidden" } as const)
    : ({ width: "100%" } as const);

  // Wide: chunk into rows of two. Narrow: a single stacked column.
  const chunkSize = isWide ? 2 : 1;
  const chunkCount = Math.ceil(configs.length / chunkSize);

  return (
    <View className="gap-3">
      {Array.from({ length: chunkCount }).map((_, i) => (
        <View key={i} className="flex-row items-stretch gap-3">
          {configs.slice(i * chunkSize, (i + 1) * chunkSize).map(c => (
            // Flex sizing must apply to a bare wrapper, not the padded ChartCard itself — a padded
            // flex child folds its padding into its border-box size and ends up narrower.
            <View key={c.key} style={cell}>
              <ChartCard
                title={c.title}
                period={c.period}
                loading={c.loading}
                onDetails={c.onDetails}
                bodyHeight={c.bodyHeight}
                className="my-0 flex-1"
                testID={`chart-card-${c.key}`}
              >
                {c.node}
              </ChartCard>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default memo(DashboardCharts);
