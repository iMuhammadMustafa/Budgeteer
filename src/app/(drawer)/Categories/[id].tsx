import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import TransactionCategoryForm from "@/src/components/forms/TransactionCategoryForm";
import { Button, IconButton, ProgressBar, ResponsiveModal, Text } from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";

export default function TransactionCategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();
  const queryClient = useQueryClient();

  const categoryService = useTransactionCategoryService();
  const groupService = useTransactionGroupService();
  const transactionService = useTransactionService();

  const { data: category, isLoading } = categoryService.useFindById(id);
  const { data: groups } = groupService.useFindAll();
  const { data: transactions } = transactionService.useFindAllView({ categoryid: id, limit: 100 });

  const [editing, setEditing] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
    queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
  };

  const group = useMemo(() => groups?.find(g => g.id === category?.groupid), [groups, category?.groupid]);

  const { spentThisPeriod, recent } = useMemo(() => {
    const list = transactions ?? [];
    const now = dayjs();
    let spent = 0;
    for (const t of list) {
      if (t.isvoid || !t.date) continue;
      const d = dayjs(t.date);
      if (d.month() === now.month() && d.year() === now.year()) {
        spent += Math.abs(Number(t.amount) || 0);
      }
    }
    const sorted = [...list].sort(
      (a, b) => dayjs(b.date ?? undefined).valueOf() - dayjs(a.date ?? undefined).valueOf(),
    );
    return { spentThisPeriod: spent, recent: sorted.slice(0, 8) };
  }, [transactions]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
        <Text variant="h3">Category not found</Text>
        <Button label="Back to Categories" variant="secondary" onPress={() => router.replace("/Categories")} />
      </View>
    );
  }

  const swatch = category.color
    ? (swatchForHex(category.color, theme) ?? accentFor(category.name ?? "", theme))
    : accentFor(category.name ?? "", theme);
  const hasBudget = !!category.budgetamount && category.budgetamount > 0;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-3 p-5 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/Categories")}
          accessibilityRole="button"
          testID="transactioncategory-back"
          className="flex-row items-center gap-1 py-1 active:opacity-70"
        >
          <MyIcon name="ChevronLeft" size={18} color={colors.inkMute} />
          <Text className="text-body text-ink-mute">Categories</Text>
        </Pressable>
        <IconButton
          icon="RefreshCw"
          variant="ghost"
          size="md"
          accessibilityLabel="Refresh"
          onPress={refresh}
          testID="transactioncategory-refresh"
        />
      </View>

      <View className="rounded-xl border border-border bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={category.icon || "Tag"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {category.name}
            </Text>
            <Text className="text-caption uppercase text-ink-mute" numberOfLines={1}>
              {group ? `${group.name} · ${category.type}` : category.type}
            </Text>
          </View>
          <Button label="Edit" variant="secondary" size="sm" leadingIcon="SquarePen" onPress={() => setEditing(true)} />
        </View>

        {hasBudget ? (
          <>
            <View className="my-4 h-px bg-border" />
            <View className="mb-2 flex-row items-center justify-between">
              {/* The figure below is always a calendar-month total; the budget's own
                  cadence (Daily/Weekly/Monthly/Yearly) is shown for context only. */}
              <Text className="text-caption uppercase tracking-wide text-ink-mute">Spent this month</Text>
              <Text className="text-caption text-ink-mute">
                of {formatCurrency(category.budgetamount, false)}
                {category.budgetfrequency ? ` (${category.budgetfrequency})` : ""}
              </Text>
            </View>
            <Text className="font-mono-semibold text-h2 text-ink">{formatCurrency(spentThisPeriod, false)}</Text>
            <View className="mt-3">
              <ProgressBar
                value={spentThisPeriod}
                max={category.budgetamount}
                color={spentThisPeriod > category.budgetamount ? "#DC2626" : swatch.fg}
              />
            </View>
          </>
        ) : null}
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="h3">Recent activity</Text>
      </View>

      {recent.length === 0 ? (
        <View className="rounded-xl border border-border bg-surface p-6">
          <Text className="text-center text-ink-mute">No transactions yet.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {recent.map(t => {
            const amt = Number(t.amount) || 0;
            const tswatch = accentFor(t.name ?? t.payee ?? "", theme);
            return (
              <View key={t.id} className="flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: tswatch.soft }}>
                  <MyIcon name={category.icon || "Circle"} size={16} color={tswatch.fg} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-body text-ink" numberOfLines={1}>
                    {t.name || t.payee || "Transaction"}
                  </Text>
                  <Text className="text-caption text-ink-mute">{dayjs(t.date ?? undefined).format("MMM D")}</Text>
                </View>
                <Text className={`font-mono-semibold text-body ${amt < 0 ? "text-danger" : "text-success"}`}>
                  {formatCurrency(amt)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <ResponsiveModal visible={editing} onClose={() => setEditing(false)} title="Edit Category" size="lg">
        <TransactionCategoryForm category={category as any} onSuccess={() => setEditing(false)} />
      </ResponsiveModal>
    </ScrollView>
  );
}
