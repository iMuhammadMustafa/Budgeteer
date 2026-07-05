import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { queryClient } from "@/src/providers/QueryProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

import MyIcon from "@/src/components/elements/MyIcon";
import {
  Button,
  ColorPicker,
  IconPicker,
  Input,
  QuickPills,
  ResponsiveModal,
  Select,
  Switch,
  Text,
} from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { AccountFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";
import { Account, Updates } from "@/src/types/database/Tables.Types";
import { currencyDropdownOptions, DEFAULT_CURRENCY, getCurrencySymbol } from "@/src/utils/currency";
import { commonValidationRules, createAccountNameValidation } from "@/src/utils/form-validation";
import { mergeRecents, useRecentValues } from "@/src/hooks/useRecentValues";
import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";
import AccountCategoryForm, { initialState as accountCategoryInitialState } from "./AccountCategoryForm";

interface AccountFormProps {
  account: AccountFormData;
  onSuccess?: (savedAccount: any) => void;
  onCancel?: () => void;
  /** When provided, renders a "Delete account" affordance (dependency-aware delete lives at the call site). */
  onDelete?: () => void;
}

export default function AccountForm({ account, onSuccess, onDelete }: AccountFormProps) {
  const accountService = useAccountService();
  const accountCategoryService = useAccountCategoryService();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";

  const { data: accountCategories } = accountCategoryService.useFindAll();
  const { data: allAccounts } = accountService.useFindAll();
  const { data: openTransaction } = accountService.useGetAccountOpenedTransaction(account.id);
  const { mutate: updateAccount } = accountService.useUpsert();
  const { mutate: updateOpenBalance } = accountService.useUpdateAccountOpenedTransaction();
  const { data: runningBalance, isLoading: isLoadingRunningBalance } = accountService.useGetAccountRunningBalance(
    account.id,
  );
  const { primaryCurrency, formatCurrency } = usePrimaryCurrency();

  // Recents (persisted picks) merged with values already used by existing accounts.
  const iconRecents = useRecentValues("account:icon");
  const colorRecents = useRecentValues("account:color");
  const categoryRecents = useRecentValues("account:categoryid");
  const iconQuick = useMemo(
    () => mergeRecents(iconRecents.recent, (allAccounts ?? []).map(a => (a as Account).icon)),
    [iconRecents.recent, allAccounts],
  );
  const colorQuick = useMemo(
    () => mergeRecents(colorRecents.recent, (allAccounts ?? []).map(a => (a as Account).color)),
    [colorRecents.recent, allAccounts],
  );
  const categoryQuick = useMemo(
    () => mergeRecents(categoryRecents.recent, (allAccounts ?? []).map(a => (a as Account).categoryid)),
    [categoryRecents.recent, allAccounts],
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const initialFormData: AccountFormData = useMemo(
    () => ({
      ...account,
      currency: account.currency || primaryCurrency || DEFAULT_CURRENCY,
      openBalance: openTransaction?.amount || null,
      addAdjustmentTransaction: true,
    }),
    [account, openTransaction?.amount, primaryCurrency],
  );

  const validationSchema: ValidationSchema<AccountFormData> = useMemo(
    () => ({
      name: createAccountNameValidation(),
      categoryid: [commonValidationRules.required("Category is required")],
      balance: [commonValidationRules.required("Balance is required")],
      statementdate: [
        {
          type: "custom",
          message: "Statement date must be between 1 and 31",
          validator: (value: any) => (value ? value >= 1 && value <= 31 : true),
        },
      ],
    }),
    [],
  );

  const { formState, updateField, validateForm, setInitialFormData, isValid, isDirty } = useFormState<AccountFormData>(
    initialFormData,
    validationSchema,
  );
  const data = formState.data;

  const handleSubmit = useCallback(
    async (submitData: AccountFormData) => {
      if (openTransaction && submitData.openBalance !== null && submitData.openBalance !== undefined) {
        updateOpenBalance({ id: openTransaction.id, amount: submitData.openBalance });
      }

      await new Promise<void>((resolve, reject) => {
        updateAccount(
          {
            form: { ...submitData },
            original: account as Account,
            props: { addAdjustmentTransaction: submitData.addAdjustmentTransaction || false },
          },
          {
            onSuccess: savedData => {
              // Remember the picks for next time (local, mode-agnostic).
              iconRecents.record(submitData.icon);
              colorRecents.record(submitData.color);
              categoryRecents.record(submitData.categoryid);
              if (onSuccess) onSuccess(savedData);
              else router.replace("/Accounts");
              resolve();
            },
            onError: error => {
              console.error("Error updating account:", error);
              reject(error);
            },
          },
        );
      });
    },
    [updateAccount, updateOpenBalance, openTransaction, account, onSuccess, iconRecents, colorRecents, categoryRecents],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit);

  const onSubmit = useCallback(() => {
    if (validateForm()) submit(formState.data);
  }, [validateForm, submit, formState.data]);

  const handleSyncRunningBalance = useCallback(() => {
    if (runningBalance !== null && runningBalance !== undefined && account.id) {
      const updatedAccount: Updates<TableNames.Accounts> = { id: account.id, balance: runningBalance };
      updateAccount(
        { form: updatedAccount, original: account as Account, props: { addAdjustmentTransaction: false } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.accounts.runningBalance(account.id) });
          },
        },
      );
      setInitialFormData({ ...formState.data, balance: runningBalance });
    }
  }, [account, updateAccount, runningBalance, setInitialFormData, formState.data]);

  const handleOpenBalanceChange = useCallback(
    (value: any) => {
      const openBalanceValue = Number(value) || 0;
      const originalBalance = Number(account.balance) || 0;
      const originalOpenAmount = Number(openTransaction?.amount) || 0;
      const newBalance = originalBalance - originalOpenAmount + openBalanceValue;
      updateField("openBalance", openBalanceValue);
      updateField("balance", newBalance);
      updateField("addAdjustmentTransaction", false);
    },
    [account.balance, openTransaction?.amount, updateField],
  );

  // Category options + selected category (drives the preview + statement-date rule).
  const categoryOptions = useMemo(
    () =>
      accountCategories?.map(c => ({
        value: c.id,
        label: c.name,
        icon: c.icon,
        color: c.color,
        group: c.type,
      })) ?? [],
    [accountCategories],
  );
  const selectedCategory = useMemo(
    () => accountCategories?.find(c => c.id === data.categoryid),
    [accountCategories, data.categoryid],
  );
  const isLiabilityAccount = selectedCategory?.type === "Liability";
  const needsRunningBalanceSync = !!account.id && runningBalance !== account.balance;

  const swatch = data.color
    ? (swatchForHex(data.color, theme) ?? accentFor(data.name ?? "", theme))
    : accentFor(data.name ?? "", theme);

  const balanceString = data.balance === null || data.balance === undefined ? "" : String(data.balance);
  const currencySymbol = getCurrencySymbol(data.currency);

  // Keep only numeric input: digits, a single leading minus, and a single dot.
  const sanitizeNumeric = (raw: string) => {
    let s = raw.replace(/[^0-9.-]/g, "");
    const negative = s.startsWith("-");
    s = s.replace(/-/g, "");
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    return (negative ? "-" : "") + s;
  };

  const normalizeBalance = () => {
    // balance is loosely populated (Input feeds strings); coerce to number|null.
    const val: unknown = data.balance;
    if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
      return updateField("balance", null);
    }
    const num = Number(val);
    if (!isNaN(num)) updateField("balance", num);
  };

  if (isLoadingRunningBalance) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 p-1">
        {/* Preview card */}
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={data.icon || "Wallet"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {data.name || "New account"}
            </Text>
            {selectedCategory ? (
              <Text className="text-caption uppercase text-ink-mute" numberOfLines={1}>
                {selectedCategory.name}
              </Text>
            ) : null}
          </View>
          <Text className="font-mono-semibold text-h3 text-ink">{formatCurrency(Number(data.balance) || 0)}</Text>
        </View>

        {/* Name */}
        <Input
          label="Account name"
          placeholder="Enter account name"
          value={data.name ?? ""}
          onChangeText={value => updateField("name", value)}
          error={formState.touched.name ? formState.errors.name : undefined}
          testID="account-name"
        />

        {/* Category (the mockup "type" pills = account categories) */}
        <QuickPills
          label="Account type"
          value={data.categoryid || null}
          onChange={value => updateField("categoryid", value)}
          options={categoryOptions}
          recent={categoryQuick}
          present="dialog"
          viewAllTitle="Choose a category"
          onAddNew={() => setAddingCategory(true)}
          addNewLabel="Add category"
          error={formState.touched.categoryid ? formState.errors.categoryid : undefined}
          testID="account-category"
        />

        {/* Icon */}
        <View>
          <Text variant="label" className="mb-[7px]">
            Icon
          </Text>
          <IconPicker
            variant="inline"
            value={data.icon}
            recent={iconQuick}
            color={swatch.fg}
            present="dialog"
            onChange={value => updateField("icon", value)}
            testID="account-icon"
          />
        </View>

        {/* Color */}
        <View>
          <Text variant="label" className="mb-[7px]">
            Color
          </Text>
          <ColorPicker
            variant="inline"
            value={data.color}
            recent={colorQuick}
            present="dialog"
            onChange={value => updateField("color", value)}
            testID="account-color"
          />
        </View>

        {/* Current balance — numeric only, symbol matches the account currency */}
        <View>
          <Text variant="label" className="mb-[7px]">
            Current balance
          </Text>
          <View
            className={`flex-row items-center rounded-lg border bg-surface px-3 py-3 ${
              formState.touched.balance && formState.errors.balance ? "border-danger" : "border-border"
            }`}
          >
            <Text className="mr-2 font-mono text-body text-ink-mute">{currencySymbol}</Text>
            <TextInput
              value={balanceString}
              onChangeText={value => updateField("balance", sanitizeNumeric(value))}
              onBlur={normalizeBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.inkFaint}
              selectionColor={colors.primary}
              className="min-w-0 flex-1 p-0 font-mono text-body text-ink"
              style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
              testID="account-balance"
            />
          </View>
          {formState.touched.balance && formState.errors.balance ? (
            <Text className="mt-1.5 text-caption text-danger">{formState.errors.balance}</Text>
          ) : null}
        </View>

        {account.id ? (
          <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-body text-ink">Record adjustment</Text>
              <Text className="text-caption text-ink-mute">Log a transaction for the balance change.</Text>
            </View>
            <Switch
              value={!!data.addAdjustmentTransaction}
              onValueChange={value => updateField("addAdjustmentTransaction", value)}
              testID="account-adjustment"
            />
          </View>
        ) : null}

        {/* Advanced (all remaining fields preserved) */}
        <View className="rounded-xl border border-border bg-surface">
          <Pressable
            onPress={() => setShowAdvanced(s => !s)}
            accessibilityRole="button"
            testID="account-advanced-toggle"
            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-80"
          >
            <Text className="text-body text-ink">Advanced</Text>
            <MyIcon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={18} color={swatch.fg} />
          </Pressable>
          {showAdvanced ? (
            <View className="gap-4 px-4 pb-4">
              <Select
                label="Currency"
                options={currencyDropdownOptions.map(o => ({ id: o.value, label: o.label, value: o.value }))}
                value={data.currency}
                onChange={value => updateField("currency", value as string)}
                testID="account-currency"
              />
              <Input
                label="Owner"
                placeholder="Enter account owner"
                value={data.owner ?? ""}
                onChangeText={value => updateField("owner", value)}
                testID="account-owner"
              />
              {isLiabilityAccount ? (
                <Input
                  label="Statement date"
                  keyboardType="number-pad"
                  placeholder="15"
                  value={data.statementdate?.toString() ?? ""}
                  onChangeText={value => updateField("statementdate", value ? Number(value) : null)}
                  error={formState.touched.statementdate ? formState.errors.statementdate : undefined}
                  testID="account-statementdate"
                />
              ) : null}
              {account.id && runningBalance !== null && runningBalance !== undefined ? (
                <View className="flex-row items-end gap-2">
                  <View className="flex-1">
                    <Input label="Running balance" editable={false} value={String(runningBalance)} />
                  </View>
                  {needsRunningBalanceSync ? (
                    <Text className="p-2 text-primary underline" onPress={handleSyncRunningBalance}>
                      Sync
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {openTransaction ? (
                <Input
                  label="Open balance"
                  keyboardType="decimal-pad"
                  value={data.openBalance?.toString() ?? "0"}
                  onChangeText={handleOpenBalanceChange}
                  testID="account-openbalance"
                />
              ) : null}
              <Input
                label="Notes"
                placeholder="Any additional notes"
                multiline
                value={data.notes ?? ""}
                onChangeText={value => updateField("notes", value)}
                testID="account-notes"
              />
            </View>
          ) : null}
        </View>

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">Error: {error.message}</Text>
          </View>
        ) : null}

        <Button
          label={account.id ? "Save Changes" : "Add Account"}
          onPress={onSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          leadingIcon="Check"
          testID="account-save"
        />

        {onDelete ? (
          <Pressable onPress={onDelete} accessibilityRole="button" className="flex-row items-center justify-center gap-2 py-2 active:opacity-70" testID="account-delete">
            <MyIcon name="Trash2" size={16} color="#DC2626" />
            <Text className="text-body text-danger">Delete account</Text>
          </Pressable>
        ) : null}

        {isDirty ? <View className="h-1" /> : null}
      </ScrollView>

      <ResponsiveModal
        visible={addingCategory}
        onClose={() => setAddingCategory(false)}
        title="Add Category"
        size="lg"
      >
        <AccountCategoryForm
          category={accountCategoryInitialState}
          onSuccess={(saved: any) => {
            if (saved?.id) updateField("categoryid", saved.id);
            setAddingCategory(false);
          }}
          onCancel={() => setAddingCategory(false)}
        />
      </ResponsiveModal>
    </SafeAreaView>
  );
}

export const initialState: AccountFormData = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  description: "",
  notes: "",
  icon: "Wallet",
  color: "info-100",
  displayorder: 0,
  owner: "",
  statementdate: null,
  tenantid: "",
  isdeleted: false,
  createdby: null,
  updatedby: null,
  openBalance: null,
  addAdjustmentTransaction: true,
};
