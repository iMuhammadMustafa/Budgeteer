import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import RecurringForm from "@/src/components/forms/RecurringForm";
import { RecurringDetails } from "@/src/components/recurrings/RecurringStatusBadges";
import { Button, GroupedInput, ResponsiveModal, Text } from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useTheme } from "@/src/providers/ThemeProvider";
import { parseRecurrenceRule, RecurringType, useRecurringService } from "@/src/services/Recurrings.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

const FREQ_UNIT: Record<string, string> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };

function frequencyLabel(rule: string | null | undefined): string | null {
  if (!rule) return null;
  const { freq, interval } = parseRecurrenceRule(rule);
  const unit = FREQ_UNIT[freq] ?? "period";
  return interval > 1 ? `Every ${interval} ${unit}s` : `Every ${unit}`;
}

export default function RecurringDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();

  const recurringService = useRecurringService();
  const transactionCategoryService = useTransactionCategoryService();

  const { data: recurring, isLoading } = recurringService.useFindById(id);
  const { data: categories } = transactionCategoryService.useFindAll();
  const { mutate: executeRecurring, isPending: isExecuting } = recurringService.useExecuteRecurring();
  const { mutate: skipRecurring, isPending: isSkipping } = recurringService.useSkipRecurring();

  const [editing, setEditing] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executeAmount, setExecuteAmount] = useState(0);

  const category = useMemo(() => categories?.find(c => c.id === recurring?.categoryid), [categories, recurring?.categoryid]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  if (!recurring) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
        <Text variant="h3">Recurring not found</Text>
        <Button label="Back to Recurrings" variant="secondary" onPress={() => router.replace("/Recurrings")} />
      </View>
    );
  }

  const isTransfer = recurring.recurringtype === RecurringType.Transfer;
  const isActionLoading = isExecuting || isSkipping;
  const canSkip = !recurring.isdateflexible && !!recurring.nextoccurrencedate && !!recurring.recurrencerule;
  const needsAmount = !recurring.amount || recurring.amount === 0 || recurring.isamountflexible;

  const swatch = category?.color
    ? (swatchForHex(category.color, theme) ?? accentFor(category.name ?? "", theme))
    : accentFor(isTransfer ? "Transfer" : recurring.name ?? "", theme);
  const previewIcon = category?.icon ?? (isTransfer ? "ArrowLeftRight" : "Repeat");
  const amountTone = isTransfer ? "text-info" : (recurring.amount ?? 0) < 0 ? "text-danger" : "text-success";

  const openExecute = () => {
    if (needsAmount) {
      setExecuteAmount(0);
      setExecuteOpen(true);
    } else {
      executeRecurring({
        recurring,
        overrides: { date: recurring.isdateflexible ? dayjs().toISOString() : undefined },
      });
    }
  };

  const handleExecuteSubmit = () => {
    executeRecurring(
      {
        recurring,
        overrides: {
          amount: executeAmount,
          date: recurring.isdateflexible ? dayjs().toISOString() : undefined,
        },
      },
      { onSuccess: () => setExecuteOpen(false) },
    );
  };

  const handleSkip = () => skipRecurring({ recurring });

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-3 p-5 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      {/* Toolbar */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/Recurrings")}
          accessibilityRole="button"
          testID="recurring-back"
          className="flex-row items-center gap-1 py-1 active:opacity-70"
        >
          <MyIcon name="ChevronLeft" size={18} color={colors.inkMute} />
          <Text className="text-body text-ink-mute">Recurring</Text>
        </Pressable>
      </View>

      {/* Header card */}
      <View className="rounded-xl border border-border bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={previewIcon} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {recurring.name}
            </Text>
            {category ? <Text className="text-caption uppercase text-ink-mute">{category.name}</Text> : null}
          </View>
          <Button label="Edit" variant="secondary" size="sm" leadingIcon="SquarePen" onPress={() => setEditing(true)} />
        </View>

        <View className="my-4 h-px bg-border" />

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-caption uppercase tracking-wide text-ink-mute">Amount</Text>
            <Text className={`font-mono-semibold text-h1 ${amountTone}`}>
              {recurring.isamountflexible || !recurring.amount ? "Flexible" : formatCurrency(recurring.amount, false)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-caption uppercase tracking-wide text-ink-mute">Next occurrence</Text>
            <Text className="text-h3 text-ink">
              {recurring.isdateflexible
                ? "Flexible"
                : recurring.nextoccurrencedate
                  ? dayjs(recurring.nextoccurrencedate).format("MMM D, YYYY")
                  : "—"}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <RecurringDetails item={recurring} />
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          label="Execute now"
          variant="secondary"
          leadingIcon="Check"
          onPress={openExecute}
          disabled={isActionLoading}
          testID="recurring-execute"
        />
        <Button
          className="flex-1"
          label="Skip"
          variant="secondary"
          leadingIcon="SkipForward"
          onPress={handleSkip}
          disabled={!canSkip || isActionLoading}
          testID="recurring-skip"
        />
      </View>

      {/* Schedule details */}
      <Text variant="h3" className="mt-2">
        Schedule
      </Text>
      <View className="rounded-xl border border-border bg-surface p-4">
        <DetailRow label="Frequency" value={recurring.isdateflexible ? "Flexible" : frequencyLabel(recurring.recurrencerule) ?? "—"} />
        <DetailRow label="End date" value={recurring.enddate ? dayjs(recurring.enddate).format("MMM D, YYYY") : "None"} />
        <DetailRow
          label="Last executed"
          value={recurring.lastexecutedat ? dayjs(recurring.lastexecutedat).format("MMM D, YYYY") : "Never"}
        />
        {recurring.payeename ? <DetailRow label="Payee" value={recurring.payeename} /> : null}
        {recurring.description ? <DetailRow label="Description" value={recurring.description} last /> : null}
        {recurring.notes ? <DetailRow label="Notes" value={recurring.notes} last /> : null}
      </View>

      {/* Edit modal */}
      <ResponsiveModal visible={editing} onClose={() => setEditing(false)} title="Edit Recurring" size="lg">
        <RecurringForm recurring={recurring} onSuccess={() => setEditing(false)} />
      </ResponsiveModal>

      {/* Execute (enter amount) modal */}
      <ResponsiveModal
        visible={executeOpen}
        onClose={() => setExecuteOpen(false)}
        title="Enter amount"
        size="lg"
        scrollable={false}
      >
        <View className="gap-4 p-2">
          <GroupedInput
            mode={recurring.type === "Income" ? "plus" : "minus"}
            amount={executeAmount}
            onChange={setExecuteAmount}
            inputTestID="recurring-execute-amount-input"
          />
          <Button
            label={isExecuting ? "Applying…" : "Apply"}
            onPress={handleExecuteSubmit}
            disabled={isExecuting}
            leadingIcon="Check"
            testID="btn-recurring-execute-apply"
          />
        </View>
      </ResponsiveModal>
    </ScrollView>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? "" : "border-b border-border"}`}>
      <Text className="text-body text-ink-mute">{label}</Text>
      <Text className="text-body text-ink" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
