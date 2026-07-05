import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { useTheme } from "@/src/providers/ThemeProvider";
import { queryKeys } from "@/src/services/queryKeys";
import type { Account } from "@/src/types/database/Tables.Types";
import { getCurrencySymbol } from "@/src/utils/currency";
import {
  AccountSelecterDropdown,
  Button,
  GroupedInput,
  IconButton,
  ResponsiveModal,
  Switch,
  Text,
} from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import MyIcon from "@/src/components/elements/MyIcon";
import AccountForm from "@/src/components/forms/AccountForm";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

const TRANSFER_CATEGORY_ID = "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9";

export default function AccountDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();
  const queryClient = useQueryClient();

  const accountService = useAccountService();
  const accountCategoryService = useAccountCategoryService();
  const transactionService = useTransactionService();

  const { data: account, isLoading } = accountService.useFindById(id);
  const { data: categories } = accountCategoryService.useFindAll();
  const { data: allAccounts } = accountService.useFindAllWithCategory();
  const { data: transactions } = transactionService.useFindAllView({ accountid: id, limit: 100 });
  const { mutate: upsertTransaction, isPending: isTransferring } = transactionService.useUpsert();
  const { mutate: upsertAccount, isPending: isAdjusting } = accountService.useUpsert();
  const { data: runningBalance, isLoading: isLoadingRunningBalance } = accountService.useGetAccountRunningBalance(id);

  const [editing, setEditing] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBalance, setAdjustBalance] = useState("");
  const [recordAdjustment, setRecordAdjustment] = useState(true);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.viewAll });
  };

  const category = useMemo(
    () => categories?.find(c => c.id === account?.categoryid),
    [categories, account?.categoryid],
  );

  const { inThisMonth, outThisMonth, recent } = useMemo(() => {
    const list = transactions ?? [];
    const now = dayjs();
    let income = 0;
    let expense = 0;
    for (const t of list) {
      if (t.isvoid || !t.date) continue;
      const amt = Number(t.amount) || 0;
      const d = dayjs(t.date);
      if (d.month() === now.month() && d.year() === now.year()) {
        if (amt > 0) income += amt;
        else expense += amt;
      }
    }
    const sorted = [...list].sort(
      (a, b) => dayjs(b.date ?? undefined).valueOf() - dayjs(a.date ?? undefined).valueOf(),
    );
    return { inThisMonth: income, outThisMonth: expense, recent: sorted.slice(0, 5) };
  }, [transactions]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  if (!account) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
        <Text variant="h3">Account not found</Text>
        <Button label="Back to Accounts" variant="secondary" onPress={() => router.replace("/Accounts")} />
      </View>
    );
  }

  const swatch = account.color
    ? (swatchForHex(account.color, theme) ?? accentFor(account.name ?? "", theme))
    : accentFor(account.name ?? "", theme);

  const handleTransfer = () => {
    if (!sourceAccountId || !transferAmount || isNaN(Number(transferAmount))) return;
    const amt = Math.abs(Number(transferAmount));
    upsertTransaction({
      form: {
        name: "Transfer",
        type: "Transfer",
        amount: -amt,
        accountid: sourceAccountId,
        transferaccountid: account.id,
        categoryid: TRANSFER_CATEGORY_ID,
        date: new Date().toISOString(),
        createdat: new Date().toISOString(),
      },
    });
    setTransferOpen(false);
    setTransferAmount(0);
    setSourceAccountId(null);
  };

  const handleAdjust = () => {
    const newBalance = Number(adjustBalance);
    if (isNaN(newBalance)) return;
    upsertAccount(
      {
        form: { id: account.id, balance: newBalance },
        original: account as Account,
        props: { addAdjustmentTransaction: recordAdjustment },
      },
      { onSuccess: () => setAdjustOpen(false) },
    );
  };

  const sanitizeNumeric = (raw: string) => {
    let s = raw.replace(/[^0-9.-]/g, "");
    const neg = s.startsWith("-");
    s = s.replace(/-/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    return (neg ? "-" : "") + s;
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-3 p-5 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      {/* Toolbar: back to list + refresh */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/Accounts")}
          accessibilityRole="button"
          testID="account-back"
          className="flex-row items-center gap-1 py-1 active:opacity-70"
        >
          <MyIcon name="ChevronLeft" size={18} color={colors.inkMute} />
          <Text className="text-body text-ink-mute">Accounts</Text>
        </Pressable>
        <IconButton
          icon="RefreshCw"
          variant="ghost"
          size="md"
          accessibilityLabel="Refresh"
          onPress={refresh}
          testID="account-refresh"
        />
      </View>

      {/* Header card */}
      <View className="rounded-xl border border-border bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={account.icon || "Wallet"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {account.name}
            </Text>
            {category ? <Text className="text-caption uppercase text-ink-mute">{category.name}</Text> : null}
          </View>
          <Button label="Edit" variant="secondary" size="sm" leadingIcon="SquarePen" onPress={() => setEditing(true)} />
        </View>

        <View className="my-4 h-px bg-border" />

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-caption uppercase tracking-wide text-ink-mute">Current balance</Text>
            <Text
              className={`font-mono-semibold text-h1 ${
                account.balance !== runningBalance ? "text-danger" : "text-ink"
              }`}
            >
              {formatCurrency(Number(account.balance) || 0, false)}
            </Text>
          </View>
          <View>
            <Text className="text-caption uppercase tracking-wide text-ink-mute">Running balance</Text>
            <Text className="font-mono-semibold text-h1 text-ink">
              {formatCurrency(Number(runningBalance) || 0, false)}
            </Text>
          </View>
        </View>
      </View>

      {/* In / Out this month */}
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-xl border border-border bg-surface p-4">
          <View className="mb-1 flex-row items-center gap-1.5">
            <MyIcon name="ArrowDownLeft" size={14} color="#15803D" />
            <Text className="text-caption uppercase text-ink-mute">In · this month</Text>
          </View>
          <Text className="font-mono-semibold text-h3 text-success">{formatCurrency(inThisMonth)}</Text>
        </View>
        <View className="flex-1 rounded-xl border border-border bg-surface p-4">
          <View className="mb-1 flex-row items-center gap-1.5">
            <MyIcon name="ArrowUpRight" size={14} color="#DC2626" />
            <Text className="text-caption uppercase text-ink-mute">Out · this month</Text>
          </View>
          <Text className="font-mono-semibold text-h3 text-danger">{formatCurrency(outThisMonth)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          label="Transfer"
          variant="secondary"
          leadingIcon="ArrowLeftRight"
          onPress={() => setTransferOpen(true)}
        />
        <Button
          className="flex-1"
          label="Adjust balance"
          variant="secondary"
          leadingIcon="SlidersHorizontal"
          onPress={() => {
            setAdjustBalance(String(account.balance ?? ""));
            setRecordAdjustment(true);
            setAdjustOpen(true);
          }}
        />
      </View>

      {/* Recent activity */}
      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="h3">Recent activity</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/Transactions")}>
          <Text className="text-body text-primary">View all</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <View className="rounded-xl border border-border bg-surface p-6">
          <Text className="text-center text-ink-mute">No transactions yet.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {recent.map(t => {
            const amt = Number(t.amount) || 0;
            // TransactionsView has no stored color; derive a stable accent from the label.
            const tswatch = accentFor(t.name ?? t.categoryname ?? "", theme);
            return (
              <View
                key={t.id}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tswatch.soft }}
                >
                  <MyIcon name={t.icon || "Circle"} size={16} color={tswatch.fg} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-body text-ink" numberOfLines={1}>
                    {t.name || t.categoryname || "Transaction"}
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

      {/* Edit modal */}
      <ResponsiveModal visible={editing} onClose={() => setEditing(false)} title="Edit Account" size="lg">
        <AccountForm account={account as any} onSuccess={() => setEditing(false)} />
      </ResponsiveModal>

      {/* Transfer modal */}
      <ResponsiveModal
        visible={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={`Transfer to ${account.name}`}
        size="lg"
        scrollable={false}
      >
        <View className="gap-3 p-2">
          <GroupedInput
            inputTestID="transfer-amount-input"
            placeholder="Amount"
            amount={transferAmount}
            mode="plus"
            allowNegativeFlip={false}
            onChange={setTransferAmount}
          />
          <AccountSelecterDropdown
            label="From"
            selectedValue={sourceAccountId}
            onSelect={(item: any) => setSourceAccountId(item?.id ?? null)}
            accounts={allAccounts?.filter(a => a.id !== account.id)}
            isModal
            groupBy="group"
          />
          <Button
            label={isTransferring ? "Transferring…" : "Submit Transfer"}
            onPress={handleTransfer}
            disabled={!sourceAccountId || !transferAmount || isTransferring}
            testID="transfer-submit-btn"
          />
        </View>
      </ResponsiveModal>

      {/* Adjust balance modal (focused — not the full edit form) */}
      <ResponsiveModal
        visible={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust balance"
        size="md"
        scrollable={false}
      >
        <View className="gap-4 p-2">
          <View>
            <Text variant="label" className="mb-[7px]">
              New balance
            </Text>
            <View className="flex-row items-center rounded-lg border border-border bg-surface px-3 py-3">
              <Text className="mr-2 font-mono text-body text-ink-mute">{getCurrencySymbol(account.currency)}</Text>
              <TextInput
                value={adjustBalance}
                onChangeText={v => setAdjustBalance(sanitizeNumeric(v))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.inkFaint}
                selectionColor={colors.primary}
                className="min-w-0 flex-1 p-0 font-mono text-body text-ink"
                style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
                testID="adjust-balance-input"
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-body text-ink">Record adjustment</Text>
              <Text className="text-caption text-ink-mute">Log a transaction for the balance change.</Text>
            </View>
            <Switch value={recordAdjustment} onValueChange={setRecordAdjustment} testID="adjust-record" />
          </View>
          <Button
            label={isAdjusting ? "Saving…" : "Save balance"}
            onPress={handleAdjust}
            disabled={isAdjusting || adjustBalance.trim() === ""}
            leadingIcon="Check"
            testID="adjust-submit-btn"
          />
        </View>
      </ResponsiveModal>
    </ScrollView>
  );
}
