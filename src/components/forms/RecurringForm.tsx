import dayjs from "dayjs";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MyIcon from "@/src/components/elements/MyIcon";
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
  Select,
  Switch,
  Text,
  type SearchableSelectOption,
  type SelectOption,
} from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useRecentValues } from "@/src/hooks/useRecentValues";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAccountService } from "@/src/services/Accounts.Service";
import {
  parseRecurrenceRule,
  RecurrenceFrequency,
  RecurringType,
  useRecurringService,
} from "@/src/services/Recurrings.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionType, Updates } from "@/src/types/database/Tables.Types";
import { getCurrencySymbol } from "@/src/utils/currency";
import { commonValidationRules } from "@/src/utils/form-validation";
import FormField from "../form-builder/FormField";
import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";
import AccountForm, { initialState as accountInitialState } from "./AccountForm";
import TransactionCategoryForm, { initialState as transactionCategoryInitialState } from "./TransactionCategoryForm";

type RecurringFormType = Omit<Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings>, "recurrencerule"> & {
  frequency: RecurrenceFrequency;
  interval: number;
  type: TransactionType;
  transferaccountid?: string | null;
  recurringType: RecurringType;
  autoApplyEnabled: boolean;
  isAmountFlexible: boolean;
  isDateFlexible: boolean;
  recurrencerule?: string;
};

const FREQUENCY_OPTIONS: SelectOption[] = [
  { id: "DAILY", label: "Daily", value: "DAILY" },
  { id: "WEEKLY", label: "Weekly", value: "WEEKLY" },
  { id: "MONTHLY", label: "Monthly", value: "MONTHLY" },
  { id: "YEARLY", label: "Yearly", value: "YEARLY" },
];

export const initialRecurringState: RecurringFormType = {
  name: "",
  description: undefined,
  nextoccurrencedate: dayjs().local().format("YYYY-MM-DD"),
  type: "Expense",
  frequency: "MONTHLY",
  interval: 1,
  enddate: undefined,
  amount: 0,
  currencycode: "USD",
  sourceaccountid: "",
  transferaccountid: null,
  recurringType: RecurringType.Standard,
  autoApplyEnabled: false,
  isAmountFlexible: false,
  isDateFlexible: false,
  categoryid: undefined,
  payeename: undefined,
  notes: undefined,
  isactive: true,
  lastexecutedat: undefined,
  tenantid: "",
};

interface RecurringFormProps {
  recurring: any;
  onSuccess?: (saved: any) => void;
}

export default function RecurringForm({ recurring, onSuccess }: RecurringFormProps) {
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const {
    formState,
    updateField,
    setFieldTouched,
    validateForm,
    isValid,
    isDirty,
    resetForm,
    isSubmitting,
    error,
    isLoading,
    isEdit,
    mode,
    setMode,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    handleRecurringTypeChange,
    handleTypeChange,
    handleFlexibleDateToggle,
    handleFlexibleAmountToggle,
    handleSwitchAccounts,
    blueprintSearch,
    handleBlueprintSelect,
    blueprintLabel,
    onSubmit,
  } = useRecurringForm({ recurring, onSuccess });

  const data = formState.data;

  const categoryGroupRecents = useRecentValues("recurring:categorygroup");
  const categoryRecents = useRecentValues("recurring:category");
  const handleCategoryChange = (id: string) => {
    updateField("categoryid", id);
    const opt = categoryOptions.find(o => o.id === id);
    if (opt?.group) categoryGroupRecents.record(opt.group);
    categoryRecents.record(id);
  };
  const recentCategoryOptions = useMemo(
    () => categoryRecents.recent.map(id => categoryOptions.find(o => o.id === id)).filter(Boolean).slice(0, 6),
    [categoryRecents.recent, categoryOptions],
  ) as (typeof categoryOptions);

  const selectedCategory = useMemo(() => categoryOptions.find(o => o.id === data.categoryid), [categoryOptions, data.categoryid]);
  const selectedAccount = useMemo(() => accountOptions.find(a => a.id === data.sourceaccountid) as any, [accountOptions, data.sourceaccountid]);
  const selectedTransferAccount = useMemo(
    () => transferAccountOptions.find(a => a.id === data.transferaccountid) as any,
    [transferAccountOptions, data.transferaccountid],
  );

  const isTransfer = data.recurringType === RecurringType.Transfer;
  const previewIcon = selectedCategory?.icon ?? (isTransfer ? "ArrowLeftRight" : "Repeat");
  const swatch = selectedCategory?.color
    ? (swatchForHex(selectedCategory.color, theme) ?? accentFor(selectedCategory.label ?? "", theme))
    : accentFor(isTransfer ? "Transfer" : data.name || "Recurring", theme);
  const amountTone = isTransfer ? "info" : undefined;
  const previewAmountClass = isTransfer ? "text-info" : mode === "minus" ? "text-danger" : "text-success";

  if (isLoading) {
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
            <MyIcon name={previewIcon} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {data.name || "New recurring"}
            </Text>
            <Text className="text-caption uppercase text-ink-mute" numberOfLines={1}>
              {data.isDateFlexible
                ? "Flexible date"
                : data.nextoccurrencedate && dayjs(data.nextoccurrencedate).isValid()
                  ? `Next: ${dayjs(data.nextoccurrencedate).format("MMM D, YYYY")}`
                  : "No date set"}
            </Text>
          </View>
          <Text className={`font-mono-semibold text-h3 ${previewAmountClass}`} numberOfLines={1}>
            {data.isAmountFlexible
              ? "Flexible"
              : formatCurrency(mode === "minus" ? -Math.abs(data.amount ?? 0) : Math.abs(data.amount ?? 0))}
          </Text>
        </View>

        {!isEdit ? (
          <SearchableSelect
            label="Blueprint transaction (optional)"
            placeholder="Search a past transaction to prefill…"
            searchAction={blueprintSearch}
            onSelect={handleBlueprintSelect}
            selectedLabel={blueprintLabel}
          />
        ) : null}

        <Input
          label="Name"
          placeholder="e.g., Rent Payment"
          value={data.name ?? ""}
          onChangeText={value => updateField("name", value)}
          onBlur={() => setFieldTouched("name")}
          error={formState.touched.name ? formState.errors.name : undefined}
          testID="recurring-name"
        />

        <View>
          <Text variant="label" className="mb-[7px]">
            Recurring type
          </Text>
          <SegmentedControl
            options={[
              { key: RecurringType.Standard, label: "Standard", tone: "primary" },
              { key: RecurringType.Transfer, label: "Transfer", tone: "info" },
            ]}
            value={data.recurringType}
            onChange={key => handleRecurringTypeChange(key as RecurringType)}
            testID="recurring-category-type"
          />
        </View>

        {data.recurringType === RecurringType.Standard ? (
          <View>
            <Text variant="label" className="mb-[7px]">
              Transaction type
            </Text>
            <SegmentedControl
              options={[
                { key: "Expense", label: "Expense", tone: "danger" },
                { key: "Income", label: "Income", tone: "success" },
                { key: "Transfer", label: "Transfer", tone: "info" },
              ]}
              value={data.type}
              onChange={handleTypeChange}
              testID="recurring-type"
            />
          </View>
        ) : null}

        {/* Flexible date */}
        <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-body text-ink">Flexible date</Text>
            <Text className="text-caption text-ink-mute">Schedule manually instead of a fixed occurrence.</Text>
          </View>
          <Switch
            value={!!data.isDateFlexible}
            onValueChange={handleFlexibleDateToggle}
            testID="switch-flexible-date"
          />
        </View>

        {!data.isDateFlexible ? (
          <View className={`${Platform.OS === "web" ? "flex flex-row gap-4" : "gap-4"}`}>
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <DateTimePicker
                label="Next occurrence"
                value={data.nextoccurrencedate ? dayjs(data.nextoccurrencedate).toISOString() : null}
                onChange={iso => updateField("nextoccurrencedate", dayjs(iso).format("YYYY-MM-DD"))}
                withTime={false}
                error={formState.touched.nextoccurrencedate ? formState.errors.nextoccurrencedate : undefined}
                testID="recurring-next-date"
              />
            </View>
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <Select
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                value={data.frequency}
                onChange={value => updateField("frequency", value as RecurrenceFrequency)}
                testID="recurring-frequency"
              />
            </View>
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <Input
                label="Interval"
                placeholder="e.g., 1"
                keyboardType="numeric"
                value={data.interval.toString()}
                onChangeText={text => updateField("interval", parseInt(text, 10) || 1)}
                testID="recurring-interval"
              />
            </View>
          </View>
        ) : null}

        {/* Flexible amount */}
        <View className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-4">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-body text-ink">Flexible amount</Text>
            <Text className="text-caption text-ink-mute">Enter the amount when you execute it.</Text>
          </View>
          <Switch
            value={!!data.isAmountFlexible}
            onValueChange={handleFlexibleAmountToggle}
            testID="switch-flexible-amount"
          />
        </View>

        {!data.isAmountFlexible ? (
          <AmountKeypadInput
            value={Math.abs(data.amount ?? 0)}
            onChange={value => updateField("amount", value)}
            mode={mode}
            onModeChange={setMode}
            tone={amountTone}
            currencySymbol={getCurrencySymbol(data.currencycode)}
            error={formState.touched.amount ? formState.errors.amount : undefined}
            testID="recurring-amount"
          />
        ) : null}

        {/* Category + Accounts */}
        <View className="gap-4 rounded-xl border border-border bg-surface p-4">
          {!isTransfer ? (
            <View className="gap-2">
              {recentCategoryOptions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerClassName="gap-2 pb-0.5"
                  testID="recurring-category-recents"
                >
                  {recentCategoryOptions.map(o => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      iconName={o.icon ?? undefined}
                      selected={o.id === data.categoryid}
                      onPress={() => handleCategoryChange(o.id)}
                      testID={`recurring-category-recent-${o.id}`}
                    />
                  ))}
                </ScrollView>
              ) : null}
              <GroupedIconSelect
                label="Category"
                options={categoryOptions}
                value={data.categoryid}
                onChange={handleCategoryChange}
                recentGroups={categoryGroupRecents.recent}
                onAddNew={() => setAddingCategory(true)}
                addNewLabel="Add New Category"
                error={formState.touched.categoryid ? formState.errors.categoryid : undefined}
                testID="recurring-category"
              />
            </View>
          ) : null}

          <View className={`${Platform.OS === "web" ? "flex flex-row items-center" : ""}`}>
            <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
              <FormField
                config={{
                  name: "sourceaccountid",
                  label: "Source account",
                  type: "select",
                  required: true,
                  options: accountOptions,
                  group: "category.name",
                  popUp: Platform.OS !== "web",
                  addNew: {
                    entityType: "Account",
                    label: "Add New Account",
                    renderForm: ({ onSuccess: onAccountSuccess, onCancel }) => (
                      <AccountForm account={accountInitialState} onSuccess={onAccountSuccess} onCancel={onCancel} />
                    ),
                  },
                }}
                value={data.sourceaccountid}
                error={formState.errors.sourceaccountid}
                touched={formState.touched.sourceaccountid}
                onChange={value => updateField("sourceaccountid", value)}
                onBlur={() => setFieldTouched("sourceaccountid")}
              />
              {selectedAccount ? (
                <Text className="mt-1.5 text-caption text-ink-mute">
                  Balance: {formatCurrency(selectedAccount.balance, false)}
                </Text>
              ) : null}
            </View>

            {isTransfer ? (
              <>
                <IconButton
                  variant="ghost"
                  icon="ArrowUpDown"
                  haptic="selection"
                  onPress={handleSwitchAccounts}
                  className={`${Platform.OS === "web" ? "mx-2 mt-5" : "my-2"} self-center p-2`}
                  accessibilityLabel="Switch source and destination accounts"
                  testID="btn-switch-accounts"
                />

                <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                  <FormField
                    config={{
                      name: "transferaccountid",
                      label: "Destination account",
                      type: "select",
                      required: true,
                      options: transferAccountOptions,
                      group: "category.name",
                      popUp: Platform.OS !== "web",
                      addNew: {
                        entityType: "Account",
                        label: "Add New Account",
                        renderForm: ({ onSuccess: onAccountSuccess, onCancel }) => (
                          <AccountForm account={accountInitialState} onSuccess={onAccountSuccess} onCancel={onCancel} />
                        ),
                      },
                    }}
                    value={data.transferaccountid}
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
            ) : null}
          </View>
        </View>

        <ResponsiveModal visible={addingCategory} onClose={() => setAddingCategory(false)} title="Add Category" size="lg">
          <TransactionCategoryForm
            category={transactionCategoryInitialState}
            onSuccess={(saved: any) => {
              if (saved?.id) handleCategoryChange(saved.id);
              setAddingCategory(false);
            }}
            onCancel={() => setAddingCategory(false)}
          />
        </ResponsiveModal>

        {/* Advanced */}
        <View className="rounded-xl border border-border bg-surface">
          <Pressable
            onPress={() => setShowAdvanced(s => !s)}
            accessibilityRole="button"
            testID="recurring-advanced-toggle"
            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-80"
          >
            <Text className="text-body text-ink">Advanced</Text>
            <MyIcon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={18} color={colors.inkMute} />
          </Pressable>
          {showAdvanced ? (
            <View className="gap-4 px-4 pb-4">
              <Input
                label="Description"
                placeholder="e.g., Monthly apartment rent"
                multiline
                value={data.description ?? ""}
                onChangeText={value => updateField("description", value)}
                testID="recurring-description"
              />
              {!isTransfer ? (
                <Input
                  label="Payee"
                  placeholder="e.g., Landlord name"
                  value={data.payeename ?? ""}
                  onChangeText={value => updateField("payeename", value)}
                  testID="recurring-payee"
                />
              ) : null}
              <Input
                label="Notes"
                placeholder="Any additional notes"
                multiline
                value={data.notes ?? ""}
                onChangeText={value => updateField("notes", value)}
                testID="recurring-notes"
              />
            </View>
          ) : null}
        </View>

        {data.isDateFlexible && data.isAmountFlexible ? (
          <View className="rounded-xl border border-info bg-info-soft p-4">
            <Text className="mb-1 font-sans-semibold text-body text-info">Fully flexible</Text>
            <Text className="text-caption text-info">
              No fixed date or amount — you&apos;ll enter both when you execute this recurring transaction.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">Error: {error.message}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-end gap-3">
          {isDirty ? (
            <Button label="Reset" variant="outline" onPress={resetForm} disabled={isSubmitting} testID="btn-recurring-reset" />
          ) : null}
          <Button
            label={isEdit ? "Save Changes" : "Add Recurring"}
            onPress={onSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            leadingIcon="Check"
            testID="btn-recurring-submit"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useRecurringForm = ({ recurring, onSuccess }: RecurringFormProps) => {
  const recurringService = useRecurringService();
  const transactionCategoryService = useTransactionCategoryService();
  const accountService = useAccountService();
  const transactionService = useTransactionService();

  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoryService.useFindAllWithGroup();
  const { data: accounts, isLoading: isAccountsLoading } = accountService.useFindAllWithCategory();
  const { mutate: upsertRecurring } = recurringService.useUpsert();

  const [mode, setMode] = useState<"plus" | "minus">(recurring?.amount && recurring.amount < 0 ? "minus" : recurring?.amount > 0 ? "plus" : "minus");
  const [blueprintLabel, setBlueprintLabel] = useState<string | null>(null);

  const isEdit = !!recurring?.id;

  const initialFormData: RecurringFormType = useMemo(() => {
    if (isEdit) {
      const { freq, interval } = parseRecurrenceRule(recurring.recurrencerule);
      return {
        ...recurring,
        amount: Math.abs(recurring.amount || 0),
        type: (recurring.type as TransactionType) || "Expense",
        frequency: freq,
        interval,
        recurringType: recurring.recurringtype || RecurringType.Standard,
        autoApplyEnabled: recurring.autoapplyenabled || false,
        isAmountFlexible: recurring.isamountflexible || false,
        isDateFlexible: recurring.isdateflexible || false,
        transferaccountid: recurring.transferaccountid || null,
        nextoccurrencedate: dayjs(recurring.nextoccurrencedate).format("YYYY-MM-DD"),
        enddate: recurring.enddate ? dayjs(recurring.enddate).format("YYYY-MM-DD") : null,
      };
    }
    return { ...initialRecurringState, ...recurring };
  }, [recurring, isEdit]);

  const validationSchema: ValidationSchema<RecurringFormType> = useMemo(
    () => ({
      name: [commonValidationRules.required("Name is required")],
      sourceaccountid: [commonValidationRules.required("Source account is required")],
      categoryid: [
        commonValidationRules.custom(
          (value, data) => data?.recurringType === RecurringType.Transfer || !!value,
          "Category is required",
        ),
      ],
      transferaccountid: [
        commonValidationRules.custom(
          (value, data) => data?.recurringType !== RecurringType.Transfer || !!value,
          "Destination account is required",
        ),
        commonValidationRules.custom(
          (value, data) => !value || !data?.sourceaccountid || value !== data.sourceaccountid,
          "Source and destination accounts must be different",
        ),
      ],
      nextoccurrencedate: [
        commonValidationRules.custom((value, data) => !!data?.isDateFlexible || !!value, "Date is required"),
      ],
      amount: [
        commonValidationRules.custom(
          (value, data) => !!data?.isAmountFlexible || (value !== null && value !== undefined),
          "Amount is required",
        ),
      ],
    }),
    [],
  );

  const { formState, updateField, setFieldTouched, validateForm, resetForm, setFormData, isValid, isDirty } =
    useFormState<RecurringFormType>(initialFormData, validationSchema);

  const handleRecurringTypeChange = useCallback(
    (value: RecurringType) => {
      updateField("recurringType", value);
      if (value === RecurringType.Transfer) {
        updateField("type", "Transfer");
        updateField("categoryid", null);
      } else {
        updateField("transferaccountid", null);
      }
    },
    [updateField],
  );

  const handleTypeChange = useCallback(
    (key: string) => {
      updateField("type", key as TransactionType);
      setMode(key === "Income" ? "plus" : "minus");
      if (key === "Transfer") updateField("categoryid", null);
      else updateField("transferaccountid", null);
    },
    [updateField],
  );

  const handleFlexibleDateToggle = useCallback(
    (value: boolean) => {
      updateField("isDateFlexible", value);
      if (value) {
        updateField("nextoccurrencedate", "");
        updateField("frequency", "MONTHLY");
        updateField("interval", 1);
      }
    },
    [updateField],
  );

  const handleFlexibleAmountToggle = useCallback(
    (value: boolean) => {
      updateField("isAmountFlexible", value);
      if (value) updateField("amount", null);
    },
    [updateField],
  );

  const handleSwitchAccounts = useCallback(() => {
    const src = formState.data.sourceaccountid;
    const dst = formState.data.transferaccountid;
    if (src && dst) {
      updateField("sourceaccountid", dst);
      updateField("transferaccountid", src);
    } else if (src && !dst) {
      updateField("sourceaccountid", "");
    }
  }, [formState.data.sourceaccountid, formState.data.transferaccountid, updateField]);

  const blueprintSearch = useCallback(
    async (query: string): Promise<SearchableSelectOption[]> => {
      const results = await transactionService.useFindByName(query);
      return results.map((r, i) => ({ id: `${r.label}-${i}`, label: r.label, value: r.item }));
    },
    [transactionService],
  );

  const handleBlueprintSelect = useCallback(
    (option: SearchableSelectOption) => {
      const blueprintTransaction = option.value as any;
      setBlueprintLabel(option.label);
      if (blueprintTransaction.amount) setMode(blueprintTransaction.amount > 0 ? "plus" : "minus");
      setFormData({
        name: blueprintTransaction.name ?? formState.data.name,
        description: blueprintTransaction.description ?? formState.data.description,
        amount: Math.abs(blueprintTransaction.amount || 0),
        type: (blueprintTransaction.type as TransactionType) ?? formState.data.type,
        currencycode:
          accounts?.find((acc: any) => acc.id === blueprintTransaction.accountid)?.currency ?? formState.data.currencycode,
        sourceaccountid: blueprintTransaction.accountid ?? formState.data.sourceaccountid,
        categoryid: blueprintTransaction.categoryid ?? formState.data.categoryid,
        payeename: blueprintTransaction.payee ?? formState.data.payeename,
      });
    },
    [accounts, formState.data, setFormData],
  );

  const handleSubmit = useCallback(
    async (submitData: RecurringFormType) => {
      const recurrenceRule = submitData.isDateFlexible ? null : `FREQ=${submitData.frequency};INTERVAL=${submitData.interval}`;
      const amount = submitData.isAmountFlexible ? null : mode === "plus" ? submitData.amount : -(submitData.amount ?? 0);

      const dataToSubmit: Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings> = {
        id: recurring?.id,
        name: submitData.name,
        description: submitData.description,
        type: submitData.type,
        nextoccurrencedate: submitData.isDateFlexible
          ? "2099-12-31"
          : submitData.nextoccurrencedate || dayjs().format("YYYY-MM-DD"),
        recurrencerule: recurrenceRule!,
        enddate: submitData.enddate,
        amount,
        currencycode: submitData.currencycode,
        sourceaccountid: submitData.sourceaccountid,
        categoryid: submitData.categoryid,
        payeename: submitData.payeename,
        notes: submitData.notes,
        isactive: submitData.isactive,
        recurringtype: submitData.recurringType,
        autoapplyenabled: submitData.autoApplyEnabled,
        isamountflexible: submitData.isAmountFlexible,
        isdateflexible: submitData.isDateFlexible,
        transferaccountid: submitData.transferaccountid,
      };

      await new Promise<void>((resolve, reject) => {
        upsertRecurring(
          { form: dataToSubmit, original: recurring?.id ? recurring : undefined },
          {
            onSuccess: savedData => {
              if (onSuccess) onSuccess(savedData);
              else router.replace("/(drawer)/(tabs)/Recurrings");
              resolve();
            },
            onError: err => reject(err),
          },
        );
      });
    },
    [mode, recurring, upsertRecurring, onSuccess],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit);

  const onSubmit = useCallback(() => {
    if (validateForm()) submit(formState.data);
  }, [validateForm, submit, formState.data]);

  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .filter(c => c.name)
        .map(c => ({
          id: c.id,
          label: c.name || "",
          icon: c.icon,
          color: c.color,
          group: c.group?.name || "Uncategorized",
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const accountOptions = useMemo(
    () =>
      (accounts ?? [])
        .filter(a => a.name)
        .map(a => ({
          id: a.id,
          label: a.name || "",
          value: a.id,
          icon: a.icon,
          color: a.color,
          balance: a.balance,
          group: a.category?.name ?? "Other",
        }))
        .sort((a, b) => (a.group !== b.group ? a.group.localeCompare(b.group) : a.label.localeCompare(b.label))),
    [accounts],
  );

  const transferAccountOptions = useMemo(
    () => accountOptions.filter(a => a.id !== formState.data.sourceaccountid),
    [accountOptions, formState.data.sourceaccountid],
  );

  return {
    formState,
    updateField,
    setFieldTouched,
    validateForm,
    isValid,
    isDirty,
    resetForm,
    isSubmitting,
    error,
    isLoading: isCategoriesLoading || isAccountsLoading,
    isEdit,
    mode,
    setMode,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    handleRecurringTypeChange,
    handleTypeChange,
    handleFlexibleDateToggle,
    handleFlexibleAmountToggle,
    handleSwitchAccounts,
    blueprintSearch,
    handleBlueprintSelect,
    blueprintLabel,
    onSubmit,
  };
};
