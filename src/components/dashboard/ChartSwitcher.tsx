/**
 * @deprecated Orphaned as of the Batch 4 details rebuild. The drill-down page
 * (`Dashboard/Details.tsx`) now renders its one chart directly from
 * `useDetailsViewModel` (params-as-source-of-truth) instead of picking a descriptor
 * out of the shared dashboard config. Kept un-deleted per the dereference-not-delete
 * convention; no live code imports this.
 *
 * ChartSwitcher — Details drill-down: renders the single chart matching the
 * route `params` (type + pieType) from the same shared config the dashboard uses.
 */
import { useTheme } from "@/src/providers/ThemeProvider";
import { DashboardChartsProps } from "@/src/types/pages/dashboard/DashboardConfig.Types";
import { ChartCard } from "@/src/components/ui";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import { buildDashboardChartConfigs } from "./dashboardChartConfigs";

export default function ChartSwitcher(props: DashboardChartsProps) {
  const { colors } = useTheme();
  const params = props.params ?? {};
  const configs = buildDashboardChartConfigs(props, colors);

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
