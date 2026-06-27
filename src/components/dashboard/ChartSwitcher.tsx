/**
 * ChartSwitcher — Details drill-down: renders the single chart matching the
 * route `params` (type + pieType) from the same shared config the dashboard uses.
 * Replaces the legacy `@/src/components/Charts/ChartSwitcher`.
 */
import { ChartCard } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { buildDashboardChartConfigs, type DashboardChartsProps } from "./dashboardChartConfigs";

export default function ChartSwitcher(props: DashboardChartsProps) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const params = props.params ?? {};
  const configs = buildDashboardChartConfigs(props, colors, n => formatCurrency(n, false));

  const match = configs.find(
    c => c.detailType === params.type && (c.pieType ? c.pieType === params.pieType : params.type !== "pie"),
  );
  if (!match) return null;

  return (
    <ChartCard title={match.title} period={match.period} testID={`chart-card-${match.key}`}>
      {match.node}
    </ChartCard>
  );
}
