/**
 * CalendarSummaryPanel — a compact "month at a glance" card shown beside the calendar heatmap on
 * wide screens, so the (otherwise sparse) full-width calendar shares the row with useful context:
 * the month's received / spent / net, how many days had activity, the top spending days (tap to
 * drill), and a dot legend. Derived entirely from the raw daily rows the heatmap already fetched.
 */
import { View } from "react-native";
import dayjs from "dayjs";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Card, Divider, Text } from "@/src/components/ui";
import { cn } from "@/src/components/ui/utils/cn";

export interface CalendarSummary {
  income: number;
  expense: number;
  net: number;
  activeDays: number;
  topDays: { date: string; amount: number }[];
}

export interface CalendarSummaryPanelProps {
  summary: CalendarSummary;
  monthLabel: string;
  fmtMoney: (n: number) => string;
  onDayPress?: (dateString: string) => void;
  className?: string;
}

export default function CalendarSummaryPanel({
  summary,
  monthLabel,
  fmtMoney,
  onDayPress,
  className,
}: CalendarSummaryPanelProps) {
  const { colors } = useTheme();
  const { income, expense, net, activeDays, topDays } = summary;

  return (
    <Card className={cn("my-1.5 gap-3 p-5", className)} testID="calendar-summary-panel">
      <Text variant="overline">{monthLabel}</Text>

      <View className="gap-2">
        <StatRow label="Received" value={fmtMoney(income)} color={colors.income} />
        <StatRow label="Spent" value={fmtMoney(expense)} color={colors.expense} />
        <StatRow
          label="Net"
          value={`${net >= 0 ? "+" : "-"}${fmtMoney(Math.abs(net))}`}
          color={net >= 0 ? colors.income : colors.expense}
          emphasise
        />
      </View>

      <Divider />

      <View className="flex-row items-baseline gap-1.5">
        <Text className="font-mono-semibold text-h3 text-ink">{activeDays}</Text>
        <Text variant="caption" className="text-ink-mute">
          {activeDays === 1 ? "day with activity" : "days with activity"}
        </Text>
      </View>

      {topDays.length > 0 ? (
        <View className="gap-1.5">
          <Text variant="overline" className="text-ink-faint">
            Top spending days
          </Text>
          {topDays.map(d => (
            <Text
              key={d.date}
              onPress={onDayPress ? () => onDayPress(d.date) : undefined}
              className={cn("flex-row", onDayPress && "active:opacity-60")}
              suppressHighlighting
            >
              <Text className="flex-1 text-sm text-ink">{dayjs(d.date).format("ddd, MMM D")}</Text>
              <Text className="font-mono text-sm" style={{ color: colors.expense }}>
                {"  "}
                {fmtMoney(d.amount)}
              </Text>
            </Text>
          ))}
        </View>
      ) : null}

      <Divider />

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <LegendDot label="Income" color={colors.income} />
        <LegendDot label="Expense" color={colors.expense} />
        <LegendDot label="Transfer" color={colors.primary} />
      </View>
    </Card>
  );
}

function StatRow({
  label,
  value,
  color,
  emphasise = false,
}: {
  label: string;
  value: string;
  color: string;
  emphasise?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={cn("text-sm text-ink-mute", emphasise && "font-sans-semibold text-ink")}>{label}</Text>
      <Text className={cn("font-mono text-sm", emphasise && "font-mono-semibold text-base")} style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
      <Text variant="caption" className="text-ink-mute">
        {label}
      </Text>
    </View>
  );
}
