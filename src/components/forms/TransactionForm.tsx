import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import dayjs from "dayjs";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/providers/ThemeProvider";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.Types";
import {
  OptionItem,
  TransactionFormData,
  TransactionSubItem,
  ValidationSchema,
} from "@/src/types/components/forms.types";
import { ConfigurationTypes } from "@/src/types/database/Config.Types";
import { TableNames } from "@/src/types/database/TableNames";
import { Transaction } from "@/src/types/database/Tables.Types";
import { roundToCents } from "@/src/utils/amount.helper";
import { currencyDropdownOptions, DEFAULT_CURRENCY, formatMoney, getCurrencySymbol } from "@/src/utils/currency";
import { commonValidationRules, createDateValidation, createDescriptionValidation } from "@/src/utils/form-validation";
import GenerateUuid from "@/src/utils/uuid.Helper";
import {
  AmountKeypadInput,
  Button,
  Chip,
  DateTimePicker,
  GroupedIconSelect,
  IconButton,
  Input,
  ResponsiveModal,
  SearchableSelect,
  SegmentedControl,
  TagInput,
  Text as ThemedText,
  type SearchableSelectOption,
} from "@/src/components/ui";
import { useRecentValues } from "@/src/hooks/useRecentValues";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useConfigurationService } from "@/src/services/Configurations.Service";
import { useExchangeRate } from "@/src/services/Fx.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionItemService } from "@/src/services/TransactionItems.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import MyIcon from "../elements/MyIcon";
import FormField from "../form-builder/FormField";
import FormSection from "../form-builder/FormSection";
import { useFormState, useFormSubmission } from "../form-builder/hooks";
import AccountForm, { initialState as accountInitialState } from "./AccountForm";
import TransactionCategoryForm, { initialState as transactionCategoryInitialState } from "./TransactionCategoryForm";

export type TransactionFormType = TransactionFormData & {
  mode?: "plus" | "minus";
};

export const initialTransactionState: TransactionFormType = {
  id: undefined,
  name: "",
  payee: "",
  description: "",
  date: dayjs().local().format("YYYY-MM-DDTHH:mm:ss"),
  amount: 0,
  type: "Expense",
  accountid: "",
  categoryid: "",
  notes: "",
  tags: null,
  isvoid: false,
  splitfromid: null,
  transferid: "",
  transferaccountid: null,
  mode: "minus",
  // Required TransactionFormData fields from DB
  createdby: "",
  updatedby: "",
  tenantid: "",
  isdeleted: false,
};

const TRANSACTION_TYPE_CONFIG = {
  Income: { mode: "plus", defaultName: "Income" },
  Expense: { mode: "minus", defaultName: "Expense" },
  Transfer: { mode: "minus", defaultName: "Transfer" },
} as const;
const transactionTypeOptions: OptionItem[] = [
  { id: "Income", label: "Income", value: "Income" },
  { id: "Expense", label: "Expense", value: "Expense" },
  { id: "Transfer", label: "Transfer", value: "Transfer" },
];
const getValidationSchema = (type: string): ValidationSchema<TransactionFormType> => {
  const baseSchema: ValidationSchema<TransactionFormType> = {
    name: [commonValidationRules.required("Transaction name is required")],
    // amount: createAmountValidation(),
    date: createDateValidation(),
    accountid: [commonValidationRules.required("Account is required")],
    categoryid: [commonValidationRules.required("Category is required")],
    type: [commonValidationRules.required("Transaction type is required")],
    description: createDescriptionValidation(false),
    notes: [],
  };

  // Add validation for transfer account
  if (type === "Transfer") {
    baseSchema.transferaccountid = [
      commonValidationRules.required("Destination account is required"),
      commonValidationRules.custom(
        (value, formData) => value !== formData?.accountid,
        "Destination account must be different from source account",
      ),
    ];
  }

  return baseSchema;
};

// The mode chip is the single source of truth for sign — `handleTypeChange` sets a sensible
// default per type (Expense/Transfer → minus, Income → plus), but the user can still flip it
// (e.g. an Expense-categorized refund that's actually a positive amount).
const calculateFinalAmount = (data: TransactionFormType, currentMode: "plus" | "minus"): number => {
  const finalAmount = Math.abs(data.amount);
  return currentMode === "minus" ? -finalAmount : finalAmount;
};

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const { colors } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const {
    onSubmit,
    isValid,
    isSubmitting,
    isLoading,
    isDirty,
    resetForm,
    handleOnMoreSubmit,
    nameSearchAction,
    onSelectItem,
    updateField,
    formState,
    setFieldTouched,
    mode,
    handleTypeChange,
    handleSwitchAccounts,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    error,
    showOneMoreSuccess,
    isOneMoreSubmitting,
    subItems,
    addSubItem,
    removeSubItem,
    updateSubItem,
    subItemsTotal,
    subItemsRemaining,
    isSubItemsBalanced,
    primaryCurrency,
    formatCurrency,
    transactionCurrency,
    setTransactionCurrency,
    displayedRate,
    handleRateOverride,
    convertedPreview,
    isFxLoading,
    isForeignCurrency,
    isRateStale,
    currentFxRate,
  } = useTransactionForm({ transaction });

  // Recently-used category *groups* float to the top of the (sheet-presented) category
  // picker — the categories within a group stay in their normal order.
  const categoryGroupRecents = useRecentValues("transaction:categorygroup");
  // Recently-used *categories* power the one-tap strip above the picker.
  const categoryRecents = useRecentValues("transaction:category");
  const handleCategoryChange = (id: string) => {
    updateField("categoryid", id);
    const opt = categoryOptions.find(o => o.id === id);
    if (opt?.group) categoryGroupRecents.record(opt.group);
    categoryRecents.record(id);
  };
  const recentCategoryOptions = useMemo(
    () =>
      categoryRecents.recent
        .map(id => categoryOptions.find(o => o.id === id))
        .filter(Boolean)
        .slice(0, 6),
    [categoryRecents.recent, categoryOptions],
  ) as typeof categoryOptions;

  // Transfer is always visually distinct (info/blue) regardless of the sign toggle; Expense/
  // Income follow the toggled `mode` (danger when minus, success when plus).
  const amountTone = formState.data.type === "Transfer" ? "info" : undefined;
  const currencySymbol = getCurrencySymbol(transactionCurrency);

  const selectedAccount = useMemo(
    () => accountOptions.find(a => a.id === formState.data.accountid) as any,
    [accountOptions, formState.data.accountid],
  );
  const selectedTransferAccount = useMemo(
    () => transferAccountOptions.find(a => a.id === formState.data.transferaccountid) as any,
    [transferAccountOptions, formState.data.transferaccountid],
  );

  const handleDateChange = (iso: string) => {
    const formattedDate = dayjs(iso).minute(dayjs().minute()).second(dayjs().second()).local().toISOString();
    updateField("date", formattedDate);
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-4"
        contentContainerStyle={
          Platform.OS === "web" ? ({ maxWidth: 640, width: "100%", alignSelf: "center" } as any) : undefined
        }
      >
        <View className="flex-row items-center justify-between">
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onPress={() => router.replace("/AddTransaction")}
            leadingIcon="Trash"
            testID="btn-clear"
          />
          <View className="relative">
            <Button
              label="One More"
              variant="secondary"
              size="sm"
              disabled={isLoading || showOneMoreSuccess}
              onPress={handleOnMoreSubmit}
              leadingIcon="Plus"
              loading={isOneMoreSubmitting}
              testID="btn-one-more"
            />
            {showOneMoreSuccess && (
              <View className="absolute -top-1 -right-1 rounded-full bg-success p-1">
                <MyIcon name="Check" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        <SegmentedControl
          options={[
            { key: "Expense", label: "Expense", tone: "danger" },
            { key: "Income", label: "Income", tone: "success" },
            { key: "Transfer", label: "Transfer", tone: "info" },
          ]}
          value={formState.data.type}
          onChange={handleTypeChange}
          testID="transaction-type"
        />

        <AmountKeypadInput
          value={Math.abs(Number(formState.data.amount) || 0)}
          onChange={value => updateField("amount", value)}
          mode={mode}
          onModeChange={nextMode => updateField("mode", nextMode)}
          tone={amountTone}
          currencySymbol={currencySymbol}
          error={formState.touched.amount ? formState.errors.amount : undefined}
          testID="field-amount"
        />

        <SearchableSelect
          label="Name"
          selectedLabel={formState.data.name}
          searchAction={nameSearchAction}
          onSelect={option => onSelectItem({ id: option.id, label: option.label, item: option.value })}
          allowFreeText
          onCommitText={val => updateField("name", val)}
        />

        {/* Category + Account */}
        <View className="gap-4 rounded-xl border border-border bg-surface p-4">
          <View className="gap-2">
            {formState.data.type !== "Transfer" && recentCategoryOptions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-2 pb-0.5"
                testID="category-recents"
              >
                {recentCategoryOptions.map(o => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    iconName={o.icon ?? undefined}
                    selected={o.id === formState.data.categoryid}
                    onPress={() => handleCategoryChange(o.id)}
                    testID={`category-recent-${o.id}`}
                  />
                ))}
              </ScrollView>
            ) : null}
            <GroupedIconSelect
              label="Category"
              options={categoryOptions}
              value={formState.data.categoryid}
              onChange={handleCategoryChange}
              recentGroups={categoryGroupRecents.recent}
              onAddNew={() => setAddingCategory(true)}
              addNewLabel="Add New Category"
              error={formState.touched.categoryid ? formState.errors.categoryid : undefined}
              testID="field-categoryid"
              present="auto"
            />
          </View>

          <View className={`${Platform.OS === "web" ? "flex flex-row items-center" : ""}`}>
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <FormField
                config={{
                  name: "accountid",
                  label: "Account",
                  type: "select",
                  required: true,
                  options: accountOptions,
                  group: "category.name",
                  popUp: Platform.OS !== "web",
                  addNew: {
                    entityType: "Account",
                    label: "Add New Account",
                    renderForm: ({ onSuccess, onCancel }) => (
                      <AccountForm account={accountInitialState} onSuccess={onSuccess} onCancel={onCancel} />
                    ),
                  },
                }}
                value={formState.data.accountid}
                error={formState.errors.accountid}
                touched={formState.touched.accountid}
                onChange={value => updateField("accountid", value)}
                onBlur={() => setFieldTouched("accountid")}
              />
              {selectedAccount ? (
                <Text className="mt-1.5 text-caption text-ink-mute">
                  Balance: {formatCurrency(selectedAccount.balance, false)}
                </Text>
              ) : null}
            </View>

            {formState.data.type === "Transfer" && (
              <>
                <IconButton
                  variant="ghost"
                  icon="ArrowUpDown"
                  haptic="selection"
                  onPress={handleSwitchAccounts}
                  className={`${Platform.OS === "web" ? "mx-2 mt-5" : "my-2"} p-2 self-center`}
                  accessibilityLabel="Switch source and destination accounts"
                  testID="btn-switch-accounts"
                />

                <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                  <FormField
                    config={{
                      name: "transferaccountid",
                      label: "Destination Account",
                      type: "select",
                      required: true,
                      options: transferAccountOptions,
                      group: "category.name",
                      addNew: {
                        entityType: "Account",
                        label: "Add New Account",
                        renderForm: ({ onSuccess, onCancel }) => (
                          <AccountForm account={accountInitialState} onSuccess={onSuccess} onCancel={onCancel} />
                        ),
                      },
                    }}
                    value={formState.data.transferaccountid}
                    error={formState.errors.transferaccountid}
                    touched={formState.touched.transferaccountid}
                    onChange={value => updateField("transferaccountid", value)}
                    onBlur={() => setFieldTouched("transferaccountid")}
                  />
                  {selectedTransferAccount ? (
                    <Text className="mt-1.5 text-caption text-ink-mute">
                      Balance: {formatCurrency(selectedTransferAccount.balance, false)}
                    </Text>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>

        <ResponsiveModal
          visible={addingCategory}
          onClose={() => setAddingCategory(false)}
          title="Add Category"
          size="lg"
        >
          <TransactionCategoryForm
            category={transactionCategoryInitialState}
            onSuccess={(saved: any) => {
              if (saved?.id) handleCategoryChange(saved.id);
              setAddingCategory(false);
            }}
            onCancel={() => setAddingCategory(false)}
          />
        </ResponsiveModal>

        {/* Date + Payee */}
        <View className={`${Platform.OS === "web" ? "flex flex-row gap-4" : "gap-4"}`}>
          <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
            <DateTimePicker label="Date" value={formState.data.date} onChange={handleDateChange} testID="field-date" />
            {formState.touched.date && formState.errors.date ? (
              <Text className="mt-1.5 text-caption text-danger">{formState.errors.date}</Text>
            ) : null}
          </View>
          {formState.data.type !== "Transfer" && (
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <Input
                label="Payee"
                placeholder="Enter payee name"
                value={formState.data.payee ?? ""}
                onChangeText={value => updateField("payee", value)}
                onBlur={() => setFieldTouched("payee")}
                error={formState.touched.payee ? formState.errors.payee : undefined}
                testID="field-payee"
              />
            </View>
          )}
        </View>

        {/* Advanced (payee, currency/FX, tags, line items — all preserved) */}
        <View className="rounded-xl border border-border bg-surface">
          <Pressable
            onPress={() => setShowAdvanced(s => !s)}
            accessibilityRole="button"
            testID="transaction-advanced-toggle"
            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-80"
          >
            <ThemedText className="text-body text-ink">Advanced</ThemedText>
            <MyIcon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={18} color={colors.inkMute} />
          </Pressable>

          {showAdvanced ? (
            <View className="gap-4 px-4 pb-4">
              <Input
                label="Note"
                placeholder="Add a note"
                value={formState.data.notes ?? ""}
                onChangeText={value => updateField("notes", value)}
                testID="field-note"
              />

              <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
                <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                  <FormField
                    config={{
                      name: "currency",
                      label: "Currency",
                      type: "select",
                      required: true,
                      options: currencyDropdownOptions,
                      popUp: Platform.OS !== "web",
                      description: `Will be stored in ${primaryCurrency}`,
                    }}
                    value={transactionCurrency}
                    onChange={value => setTransactionCurrency(value || primaryCurrency)}
                  />
                </View>
                {isForeignCurrency && (
                  <View className={Platform.OS === "web" ? "flex-1" : ""}>
                    <FormField
                      config={{
                        name: "rate",
                        label: `Rate (1 ${transactionCurrency} → ${primaryCurrency})`,
                        type: "number",
                        placeholder: isFxLoading ? "Loading…" : "0.00",
                        description: isFxLoading
                          ? "Fetching rate…"
                          : `≈ ${formatMoney(convertedPreview, primaryCurrency)}`,
                      }}
                      value={displayedRate?.toString() ?? ""}
                      onChange={handleRateOverride}
                    />
                    {isRateStale && currentFxRate ? (
                      <Text className="text-status-warning text-xs mt-1">
                        FX rate has changed since this transaction was recorded — current rate:{" "}
                        {currentFxRate.toFixed(4)}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              <TagInput
                label="Tags"
                placeholder="Add a tag…"
                value={
                  Array.isArray(formState.data.tags)
                    ? formState.data.tags
                    : formState.data.tags
                      ? String(formState.data.tags)
                          .split(",")
                          .map(t => t.trim())
                          .filter(Boolean)
                      : []
                }
                onChange={tags => updateField("tags", tags)}
                onBlur={() => setFieldTouched("tags")}
                error={formState.touched.tags ? formState.errors.tags : undefined}
                testID="field-tags"
              />
              <Text className="text-caption text-ink-mute">Add tags to categorize and search transactions</Text>

              {/* Line Items — optional sub-item breakdown */}
              <FormSection
                title="Line Items"
                description="Optional breakdown of this transaction into individual items"
                actionBtn={
                  <IconButton
                    variant="outline"
                    icon="Plus"
                    onPress={() => addSubItem()}
                    accessibilityLabel="Add line item"
                    testID="btn-add-subitem"
                    className="mt-1"
                  />
                }
              >
                {subItems.length > 0 && (
                  <View>
                    <View className="flex-row items-center justify-between mb-3 px-1">
                      <ThemedText className="text-xs">Items total: {subItemsTotal.toFixed(2)}</ThemedText>
                      <ThemedText
                        className={`text-xs font-medium ${isSubItemsBalanced ? "text-success-500" : "text-danger-500"}`}
                      >
                        {isSubItemsBalanced ? "✓ Balanced" : `Remaining: ${subItemsRemaining.toFixed(2)}`}
                      </ThemedText>
                    </View>

                    {subItems.map((item, index) => (
                      <View key={item.id || index} className="border border-border rounded-lg p-3 mb-2 bg-card">
                        <View className="flex-row items-center justify-end mb-2">
                          <Pressable
                            onPress={() => removeSubItem(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove item ${index + 1}`}
                            testID={`btn-remove-subitem-${index}`}
                            className="m-0 p-0 active:opacity-60"
                          >
                            <MyIcon name="X" size={16} className="text-danger-500" />
                          </Pressable>
                        </View>
                        <View className={`${Platform.OS === "web" ? "flex flex-row gap-2" : "gap-2"}`}>
                          <View className="flex-[2]">
                            <TextInput
                              placeholder="Item name"
                              value={item.name}
                              onChangeText={val => updateSubItem(index, "name", val)}
                              className="border border-border rounded-md px-3 py-2 text-foreground bg-background"
                              testID={`input-subitem-name-${index}`}
                            />
                          </View>
                          <View className="justify-center">
                            {(() => {
                              const subItemMode =
                                (item.amount ?? 0) < 0 || Object.is(item.amount, -0) ? "minus" : "plus";
                              return (
                                <IconButton
                                  icon={subItemMode === "minus" ? "Minus" : "Plus"}
                                  variant="ghost"
                                  haptic="selection"
                                  onPress={() => updateSubItem(index, "amount", -(item.amount ?? 0))}
                                  accessibilityLabel={`Toggle amount sign, currently ${subItemMode}`}
                                  testID={`btn-subitem-mode-${index}`}
                                  className={`${subItemMode === "plus" ? "bg-success-400" : "bg-danger-400"} border border-muted rounded-lg p-1.5`}
                                />
                              );
                            })()}
                          </View>
                          <View className="flex-1">
                            <TextInput
                              placeholder="Amount"
                              value={item.amount || Object.is(item.amount, -0) ? String(Math.abs(item.amount)) : ""}
                              onChangeText={val => {
                                let cleanValue = val
                                  .replace(/[^0-9.]/g, "")
                                  .replace(/\.{2,}/g, ".")
                                  .replace(/^0+(?=\d)/, "");
                                if (cleanValue.includes(".")) {
                                  const parts = cleanValue.split(".");
                                  if (parts[1] && parts[1].length > 2) {
                                    cleanValue = parts[0] + "." + parts[1].substring(0, 2);
                                  }
                                }
                                const parsed = parseFloat(cleanValue) || 0;
                                const isNegative = (item.amount ?? 0) < 0 || Object.is(item.amount, -0);
                                updateSubItem(index, "amount", isNegative ? -parsed : parsed);
                              }}
                              keyboardType="decimal-pad"
                              className="border border-border rounded-md px-3 py-2 text-foreground bg-background"
                              testID={`input-subitem-amount-${index}`}
                            />
                          </View>
                          <View className="flex-[1.5]">
                            <TextInput
                              placeholder="Notes (optional)"
                              value={item.notes || ""}
                              onChangeText={val => updateSubItem(index, "notes", val || null)}
                              className="border border-border rounded-md px-3 py-2 text-foreground bg-background h-full"
                              testID={`input-subitem-notes-${index}`}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </FormSection>
            </View>
          ) : null}
        </View>

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">Error: {error.message}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-end gap-3">
          {isDirty ? (
            <Button
              label="Reset"
              variant="outline"
              onPress={resetForm}
              disabled={isSubmitting}
              testID="btn-form-reset"
            />
          ) : null}
          <Button
            label={isSubmitting ? "Saving..." : "Save Transaction"}
            onPress={onSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            leadingIcon="Check"
            testID="btn-form-submit"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useTransactionForm = ({ transaction }: { transaction: TransactionFormType }) => {
  const transactionCategoryService = useTransactionCategoryService();
  const accountService = useAccountService();
  const transactionService = useTransactionService();
  const transactionItemService = useTransactionItemService();
  const configurationService = useConfigurationService();

  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoryService.useFindAllWithGroup();
  // The category used for transfers is resolved from configuration (never by name).
  // Falls back to any Transfer/Adjustment-typed category so the picker still
  // auto-fills if the mapping is absent; the write path self-heals it for real.
  const { data: transferCategoryConfig } = configurationService.useGetConfiguration(
    TableNames.TransactionCategories,
    ConfigurationTypes.AccountOpertationsCategory,
    "id",
  );
  const transferCategoryId = useMemo(() => {
    const mapped = transferCategoryConfig?.value;
    if (mapped && categories?.some(c => c.id === mapped)) return mapped;
    return categories?.find(c => c.type === "Transfer" || c.type === "Adjustment")?.id ?? null;
  }, [transferCategoryConfig?.value, categories]);
  const { data: accounts, isLoading: isAccountLoading } = accountService.useFindAllWithCategory();
  const { mutate: upsertTransaction } = transactionService.useUpsert();
  const createItemsMutation = transactionItemService.useCreateMultiple();
  const deleteItemsMutation = transactionItemService.useDeleteByTransactionId();
  const { data: existingItems, isLoading: isExistingItemsLoading } = transactionItemService.useFindByTransactionId(
    transaction.id,
  );
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [showOneMoreSuccess, setShowOneMoreSuccess] = useState(false);
  const [isOneMoreSubmitting, setIsOneMoreSubmitting] = useState(false);

  const [subItems, setSubItems] = useState<TransactionSubItem[]>([]);

  const { primaryCurrency, formatCurrency } = usePrimaryCurrency();
  const [transactionCurrency, setTransactionCurrency] = useState<string>(primaryCurrency || DEFAULT_CURRENCY);
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const hasInitializedCurrencyRef = useRef(false);

  // One-shot init: when primaryCurrency loads after mount, adopt it.
  // After the first sync we never overwrite the user's explicit choice (incl. picking USD).
  useEffect(() => {
    if (hasInitializedCurrencyRef.current) return;
    if (!primaryCurrency) return;
    hasInitializedCurrencyRef.current = true;
    if (transactionCurrency !== primaryCurrency) {
      setTransactionCurrency(primaryCurrency);
    }
  }, [primaryCurrency, transactionCurrency]);

  const isForeignCurrency = transactionCurrency !== primaryCurrency;
  const { rate: fxRate, isLoading: isFxLoading } = useExchangeRate(transactionCurrency, primaryCurrency);
  const effectiveRate = rateOverride ?? fxRate ?? 1;
  const displayedRate = effectiveRate;

  // Surface a warning when the rate currently applied to the transaction (from the saved
  // exchange_rate or the user's override) drifts noticeably from today's API rate. Only
  // matters when editing a foreign-currency transaction; threshold is 0.5%.
  const storedRate = (transaction as any).exchange_rate as number | undefined;
  const isRateStale = useMemo(() => {
    if (!transaction?.id) return false;
    if (!isForeignCurrency) return false;
    const baseRate = storedRate ?? rateOverride;
    if (!baseRate || !fxRate || baseRate <= 0 || fxRate <= 0) return false;
    return Math.abs(baseRate - fxRate) / fxRate > 0.005;
  }, [transaction?.id, isForeignCurrency, storedRate, rateOverride, fxRate]);

  const handleRateOverride = useCallback((value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "").replace(/\.{2,}/g, ".");
    if (cleaned === "" || cleaned === ".") {
      setRateOverride(null);
      return;
    }
    const parsed = parseFloat(cleaned);
    setRateOverride(isNaN(parsed) ? null : parsed);
  }, []);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setSubItems(
        existingItems.map(item => ({
          id: item.id,
          name: item.name,
          amount: item.amount,
          categoryid: item.categoryid,
          notes: item.notes,
        })),
      );
    }
  }, [existingItems]);

  const removeSubItem = useCallback((index: number) => {
    setSubItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSubItem = useCallback((index: number, field: keyof TransactionSubItem, value: any) => {
    setSubItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Signed sum so items with opposite mode (e.g. a refund line on an expense) net correctly
  // against the parent. Rounded to cents to avoid float drift when comparing to the parent.
  const subItemsTotal = useMemo(() => {
    return roundToCents(subItems.reduce((sum, item) => sum + (item.amount || 0), 0));
  }, [subItems]);

  // On edit, prefer the user's original typed amount (in the original currency) so the
  // form round-trips through FX without compounding rounding. Falls back to the stored
  // primary-currency amount for legacy rows where original_* haven't been backfilled.
  const initialFormData: TransactionFormType = useMemo(() => {
    const storedOriginal = (transaction as any).original_amount as number | undefined;
    const storedConverted = transaction.amount ?? 0;
    const seedAmount = storedOriginal && storedOriginal !== 0 ? storedOriginal : storedConverted;
    const seedMode = seedAmount && seedAmount !== 0 ? (seedAmount < 0 ? "minus" : "plus") : "minus";
    return {
      ...transaction,
      amount: Math.abs(seedAmount),
      mode: seedMode,
    };
  }, [transaction]);

  // Seed transactionCurrency + rateOverride from the stored original_* fields exactly once
  // when editing. After that the user is in control.
  const hasSeededFromOriginalRef = useRef(false);
  useEffect(() => {
    if (hasSeededFromOriginalRef.current) return;
    if (!transaction?.id) return;
    const origCurrency = (transaction as any).original_currency as string | undefined;
    const origRate = (transaction as any).exchange_rate as number | undefined;
    if (origCurrency) {
      hasSeededFromOriginalRef.current = true;
      setTransactionCurrency(origCurrency);
      if (typeof origRate === "number" && Number.isFinite(origRate) && origRate > 0) {
        setRateOverride(origRate);
      }
    }
  }, [transaction]);

  const [transactionType, setTransactionType] = useState<string>(initialFormData.type);

  const validationSchema = useMemo(() => getValidationSchema(transactionType), [transactionType]);
  const { formState, updateField, setFieldTouched, validateForm, resetForm, setFormData, isValid, isDirty } =
    useFormState<TransactionFormType>(initialFormData, validationSchema);

  // formState.data.amount is stored as an absolute value; the form-wide `mode` carries the sign.
  // Compare the signed parent against the signed sum of items.
  const parentSigned = useMemo(
    () => roundToCents(mode === "minus" ? -Math.abs(formState.data.amount) : Math.abs(formState.data.amount)),
    [mode, formState.data.amount],
  );
  const subItemsRemaining = useMemo(() => roundToCents(parentSigned - subItemsTotal), [parentSigned, subItemsTotal]);
  const isSubItemsBalanced = useMemo(() => {
    if (subItems.length === 0) return true;
    return subItemsRemaining === 0;
  }, [subItems, subItemsRemaining]);

  // New rows start at the current signed remaining gap (already rounded to cents), so they
  // both auto-rebalance to 0 and never inherit float drift from an abs()-based calculation
  // that ignored mixed-sign items (e.g. a refund line within an expense breakdown).
  const addSubItem = useCallback(() => {
    setSubItems(prev => [
      ...prev,
      { id: GenerateUuid(), name: "", categoryid: null, notes: null, amount: subItemsRemaining },
    ]);
  }, [subItemsRemaining]);

  const convertedPreview = useMemo(() => {
    const userTyped = Math.abs(Number(formState.data.amount) || 0);
    return userTyped * (isForeignCurrency ? effectiveRate : 1);
  }, [formState.data.amount, effectiveRate, isForeignCurrency]);

  const handleSubmit = useCallback(
    async (data: TransactionFormType) => {
      if (data.type === "Transfer" && data.accountid === data.transferaccountid) {
        throw new Error("Source and destination accounts must be different");
      }

      // Validate sub-items balance if enabled
      if (subItems.length > 0 && !isSubItemsBalanced) {
        throw new Error("Line items must sum to the transaction amount");
      }

      const rateForSubmit = isForeignCurrency ? effectiveRate : 1;
      const userTypedAbs = roundToCents(Math.abs(Number(data.amount) || 0));
      const convertedInput = roundToCents(userTypedAbs * rateForSubmit);
      const finalAmount = calculateFinalAmount({ ...data, amount: convertedInput }, mode);
      // Sign the original_amount the same way as the final amount so the relation
      // `original_amount * exchange_rate ≈ amount` holds when signs are preserved.
      const originalSigned = calculateFinalAmount({ ...data, amount: userTypedAbs }, mode);

      const { mode: _mode, last_used: _last_used, ...restData } = data as any;

      const submissionData = {
        ...restData,
        amount: finalAmount,
        original_amount: originalSigned,
        original_currency: transactionCurrency,
        exchange_rate: rateForSubmit,
        payee: data.type === "Transfer" ? null : data.payee,
      };

      await upsertTransaction(
        {
          form: submissionData,
          original: transaction.id ? (transaction as Transaction) : undefined,
        },
        {
          onSuccess: async () => {
            // Save sub-items after the transaction is created/updated
            const txnId = data.id || submissionData.id;
            if (txnId && subItems.length > 0) {
              // Delete existing items first (for edits)
              if (transaction.id) {
                await deleteItemsMutation.mutateAsync(txnId);
              }
              // Create new items
              const itemInserts = subItems.map((item, index) => ({
                id: item.id || GenerateUuid(),
                transactionid: txnId,
                name: item.name,
                amount: item.amount,
                categoryid: item.categoryid || null,
                notes: item.notes || null,
                displayorder: index,
              }));
              await createItemsMutation.mutateAsync({ data: itemInserts });
            } else if (txnId && transaction.id) {
              // If sub-items were disabled, clean up any existing items
              await deleteItemsMutation.mutateAsync(txnId);
            }
          },
          onError: error => {
            console.error("Error saving transaction:", error);
          },
        },
      );
    },
    [
      upsertTransaction,
      transaction,
      mode,
      subItems,
      isSubItemsBalanced,
      createItemsMutation,
      deleteItemsMutation,
      effectiveRate,
      isForeignCurrency,
      transactionCurrency,
    ],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowOneMoreSuccess(true);
      setTimeout(() => setShowOneMoreSuccess(false), 2000);
    },
    onError: error => {
      console.error("Failed to save transaction:", error);
    },
  });

  const onSubmit = useCallback(() => {
    if (validateForm()) {
      const { mode: _mode, last_used: _last_used, ...restData } = formState.data as any;

      submit(restData);
      resetForm();
      router.navigate("/Transactions");
    }
  }, [validateForm, submit, formState.data, resetForm]);

  const handleOnMoreSubmit = useCallback(() => {
    if (validateForm()) {
      const { mode: _mode, last_used: _last_used, ...restData } = formState.data as any;
      setIsOneMoreSubmitting(true);
      const updatedDate = dayjs(formState.data.date).local().add(1, "second").format("YYYY-MM-DDTHH:mm:ss");

      const newTransactionData: TransactionFormType = {
        ...restData,
        date: updatedDate,
      };

      submit(restData).then(() => {
        setFormData(newTransactionData);
        setIsOneMoreSubmitting(false);
      });
    }
  }, [validateForm, submit, formState.data, setFormData]);

  // Synchronize mode state with form data
  useEffect(() => {
    const currentMode = formState.data.mode || (transaction.amount && transaction.amount < 0 ? "minus" : "plus");
    setMode(currentMode);
  }, [formState.data.mode, transaction.amount]);

  // Enhanced transaction type change handling
  const handleTypeChange = useCallback(
    (type: string) => {
      const typeConfig = TRANSACTION_TYPE_CONFIG[type as keyof typeof TRANSACTION_TYPE_CONFIG];

      if (!typeConfig) {
        console.warn(`Unknown transaction type: ${type}`);
        return;
      }

      // Update type and mode
      updateField("type", type);
      setMode(typeConfig.mode);
      updateField("mode", typeConfig.mode);
      setTransactionType(type);

      // Set default name if current name is empty or matches previous type
      if (
        !formState.data.name ||
        Object.values(TRANSACTION_TYPE_CONFIG).some(config => formState.data.name === config.defaultName)
      ) {
        updateField("name", typeConfig.defaultName);
      }

      // Handle transfer-specific logic
      if (type === "Transfer") {
        // Clear payee for transfers
        updateField("payee", "");

        // Set the configured transfer category (resolved via configuration, not by name)
        if (transferCategoryId) {
          updateField("categoryid", transferCategoryId);
        }
      } else {
        // Clear transfer account for non-transfers
        updateField("transferaccountid", null);
      }
    },
    [updateField, transferCategoryId, formState.data.name],
  );

  // Enhanced account switching for transfers with validation
  const handleSwitchAccounts = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const currentAccountId = formState.data.accountid;
    const currentTransferAccountId = formState.data.transferaccountid;

    // Only switch if both accounts are selected
    if (currentAccountId && currentTransferAccountId) {
      updateField("accountid", currentTransferAccountId);
      updateField("transferaccountid", currentAccountId);
    } else if (currentAccountId && !currentTransferAccountId) {
      // If only source account is selected, clear it and wait for user to select destination
      updateField("accountid", "");
    }
  }, [formState.data.accountid, formState.data.transferaccountid, updateField]);

  // Enhanced searchable dropdown selection with better data handling
  const onSelectItem = useCallback(
    (item: SearchableDropdownItem) => {
      const selectedTransaction = item.item;

      // Determine mode based on transaction type and amount
      let selectedMode: "plus" | "minus" = "minus";
      if (selectedTransaction.type === "Income") {
        selectedMode = "plus";
      } else if (selectedTransaction.type === "Transfer" || selectedTransaction.type === "Expense") {
        selectedMode = "minus";
      } else {
        selectedMode = selectedTransaction.amount < 0 ? "minus" : "plus";
      }

      setMode(selectedMode);

      // Sync transactionType state so the correct validation schema is used
      if (selectedTransaction.type) {
        setTransactionType(selectedTransaction.type);
      }

      // Populate form with selected transaction data
      const populatedData: Partial<TransactionFormType> = {
        ...selectedTransaction,
        amount: Math.abs(selectedTransaction.amount),
        mode: selectedMode,
        // Preserve current date unless it's a new transaction
        date: transaction.id ? selectedTransaction.date : formState.data.date,
        // Clear ID for new transactions based on existing transaction
        id: transaction.id || undefined,
      };

      setFormData(populatedData);
    },
    [setFormData, transaction.id, formState.data.date],
  );

  // Enhanced dropdown options with better filtering and sorting
  const categoryOptions = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter(item => item.name) // Filter out categories without names
      .map(item => ({
        id: item.id,
        label: item.name || "",
        value: item.id,
        icon: item.icon,
        color: item.color,
        group: item.group?.name || "Uncategorized",
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [categories]);

  const accountOptions = useMemo(() => {
    if (!accounts) return [];

    return accounts
      .filter(item => item.name) // Filter out accounts without names
      .map(item => ({
        id: item.id,
        label: item.name || "",
        value: item.id,
        icon: item.icon,
        color: item.color,
        balance: item.balance,
        // Accounts do not have categoryname, fallback to "Other"
        group: item.category?.name ?? "Other",
      }))
      .sort((a, b) => {
        // Sort by group first, then by name
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        return a.label.localeCompare(b.label);
      });
  }, [accounts]);

  // Filter account options for transfer destination (exclude source account)
  const transferAccountOptions = useMemo(() => {
    return accountOptions.filter(account => account.id !== formState.data.accountid);
  }, [accountOptions, formState.data.accountid]);

  const isEdit = !!transaction.id;
  const isLoading = isSubmitting || isCategoriesLoading || isAccountLoading;

  const findByNameStable = useCallback(
    (text: string, tenantId: string) => transactionService.useFindByName(text),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // SearchableSelect adapter for the transaction name/payee lookup. tenantId is captured
  // via closure (the underlying findByName ignores it, but we honor the legacy signature)
  // and results are mapped to the ui SearchableSelectOption shape. The label doubles as the
  // option id (the search view groups by name, so names are unique per result set).
  const nameSearchAction = useCallback(
    async (query: string): Promise<SearchableSelectOption[]> => {
      const results = await findByNameStable(query, transaction.tenantid);
      return results.map((r, i) => ({
        id: `${r.label}-${i}`,
        label: r.label,
        value: r.item,
      }));
    },
    [findByNameStable, transaction.tenantid],
  );

  return {
    formState,
    updateField,
    setFieldTouched,
    isValid: isValid && isSubItemsBalanced,
    isDirty,
    isSubmitting,
    isCategoriesLoading,
    isAccountLoading,
    onSubmit,
    resetForm,
    handleOnMoreSubmit,
    mode,
    handleTypeChange,
    handleSwitchAccounts,
    onSelectItem,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    error,
    isEdit,
    isLoading,
    nameSearchAction,
    showOneMoreSuccess,
    isOneMoreSubmitting,
    subItems,
    addSubItem,
    removeSubItem,
    updateSubItem,
    subItemsTotal,
    subItemsRemaining,
    isSubItemsBalanced,
    primaryCurrency,
    formatCurrency,
    transactionCurrency,
    setTransactionCurrency,
    displayedRate,
    handleRateOverride,
    convertedPreview,
    isFxLoading,
    isForeignCurrency,
    isRateStale,
    currentFxRate: fxRate,
  };
};
