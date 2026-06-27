/**
 * DashboardCharts — renders all six dashboard charts (new ui/charts) by mapping
 * the shared `buildDashboardChartConfigs` descriptor list into ChartCards, two
 * across on wide screens. Replaces the legacy `@/src/components/Charts/DashboardCharts`.
 */
import { useWindowDimensions } from "react-native";

import { ChartCard } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { buildDashboardChartConfigs, type DashboardChartsProps } from "./dashboardChartConfigs";

export default function DashboardCharts(props: DashboardChartsProps) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const configs = buildDashboardChartConfigs(props, colors, n => formatCurrency(n, false));

  return (
    <>
      {configs.map(c => (
        <ChartCard
          key={c.key}
          title={c.title}
          period={c.period}
          className="my-0"
          style={{ width: isWide ? "48%" : "100%" }}
          testID={`chart-card-${c.key}`}
        >
          {c.node}
        </ChartCard>
      ))}
    </>
  );
}
