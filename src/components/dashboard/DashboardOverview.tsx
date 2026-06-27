/**
 * DashboardOverview — the top of the dashboard: a greeting header with a refresh
 * pill, a hero "total balance" card (balance + month change + net-worth sparkline),
 * and a responsive stat row (Income · Spending · Net Flow · Savings rate). Pure
 * presentation; all numbers are passed in from the dashboard view-model.
 */
import { Pressable, View, useWindowDimensions } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { Badge, Card, MiniBarChart, Text } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import dayjs from "dayjs";

export interface DashboardOverviewProps {
  totalBalance: number;
  accountsCount: number;
  income: number;
  spending: number;
  sparkline: number[];
  onRefresh: () => void;
}

function greeting() {
  const h = dayjs().hour();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverview({
  totalBalance,
  accountsCount,
  income,
  spending,
  sparkline,
  onRefresh,
}: DashboardOverviewProps) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const netFlow = income - spending;
  const savingsRate = income > 0 ? Math.round((netFlow / income) * 100) : 0;

  return (
    <View className="gap-4">
      {/* Greeting + refresh */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="h1">{greeting()}</Text>
          <Text variant="caption" className="mt-1">
            Here&apos;s where your money stands today.
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh dashboard"
          testID="btn-refresh-dashboard"
          className="flex-row items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 active:opacity-70"
        >
          <MyIcon name="RefreshCw" size={15} color={colors.inkMute} />
          <Text variant="label">Refresh</Text>
        </Pressable>
      </View>

      {/* Hero balance card */}
      <Card className="flex-row flex-wrap items-center justify-between gap-4">
        <View>
          <Text variant="overline">
            Total balance · {accountsCount} {accountsCount === 1 ? "account" : "accounts"}
          </Text>
          <Text variant="moneyLg" className="mt-2 text-display">
            {formatCurrency(totalBalance, false)}
          </Text>
          <View className="mt-3 flex-row items-center gap-2.5">
            <Badge
              tone={netFlow >= 0 ? "success" : "danger"}
              iconName={netFlow >= 0 ? "TrendingUp" : "TrendingDown"}
              label={formatCurrency(netFlow, true)}
            />
            <Text variant="caption">this month</Text>
          </View>
        </View>
        {sparkline.length > 1 && (
          <View className="gap-2">
            <Text variant="overline">Net worth · last {sparkline.length} mo</Text>
            <MiniBarChart values={sparkline} color={colors.primary} height={64} className="w-40" />
          </View>
        )}
      </Card>

      {/* Stat row */}
      <View className="flex-row flex-wrap gap-3">
        <StatCard icon="ArrowDownLeft" label="Income" value={formatCurrency(income, true)} caption="This month" tone="income" wide={isWide} />
        <StatCard icon="ArrowUpRight" label="Spending" value={formatCurrency(-spending, true)} caption="This month" tone="expense" wide={isWide} />
        <StatCard
          icon="ArrowRightLeft"
          label="Net flow"
          value={formatCurrency(netFlow, true)}
          caption="Income − spending"
          tone={netFlow >= 0 ? "income" : "expense"}
          wide={isWide}
        />
        <StatCard icon="PiggyBank" label="Savings rate" value={`${savingsRate}%`} caption="of income saved" tone="ink" wide={isWide} />
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  caption,
  tone,
  wide,
}: {
  icon: string;
  label: string;
  value: string;
  caption: string;
  tone: "income" | "expense" | "ink";
  wide: boolean;
}) {
  const { colors } = useTheme();
  const valueClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-ink";
  return (
    <Card className="flex-1 gap-1.5" style={{ minWidth: wide ? 160 : 140 }} testID={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <View className="flex-row items-center gap-2">
        <MyIcon name={icon} size={15} color={colors.inkMute} />
        <Text variant="overline">{label}</Text>
      </View>
      <Text variant="money" className={`text-h3 ${valueClass}`}>
        {value}
      </Text>
      <Text variant="caption">{caption}</Text>
    </Card>
  );
}
