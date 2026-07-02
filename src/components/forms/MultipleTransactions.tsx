import dayjs from "dayjs";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AmountKeypadInput,
  Button,
  DateTimePicker,
  GroupedIconSelect,
  GroupedInput,
  IconButton,
  Input,
  Loader,
  SegmentedControl,
  Text,
} from "@/src/components/ui";

import {
  MultipleTransactionItemData,
  MultipleTransactionsFormData,
  ValidationSchema,
} from "@/src/types/components/forms.types";

import MyIcon from "../elements/MyIcon";
import { queryClient } from "@/src/providers/QueryProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useExchangeRate } from "@/src/services/Fx.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionsView } from "@/src/types/database/Tables.Types";
import { roundToCents } from "@/src/utils/amount.helper";
import { currencyDropdownOptions, DEFAULT_CURRENCY, formatMoney, getCurrencySymbol } from "@/src/utils/currency";
import { commonValidationRules, createDateValidation, createDescriptionValidation } from "@/src/utils/form-validation";
import GenerateUuid from "@/src/utils/uuid.Helper";
import FormField from "../form-builder/FormField";
import { useFormState, useFormSubmission } from "../form-builder/hooks";
import { router } from "expo-router";
import { TransactionFormType } from "./TransactionForm";

// Generate initial state for multiple transactions form
const generateInitialState = (): MultipleTransactionsFormData => {
  const groupId = GenerateUuid();
  const transactionId = GenerateUuid();

  return {
    originalTransactionId: null,
    payee: "",
    date: dayjs().local().format("YYYY-MM-DDTHH:mm:ss"),
    description: "",
    type: "Expense",
    isvoid: false,
    accountid: "",
    groupid: groupId,
    transactions: {
      [transactionId]: {
        name: "",
        amount: 0,
        categoryid: "",
        notes: null,
        tags: null,
        groupid: groupId,
      },
    },
  };
};

export const initialMultipleTransactionsState = generateInitialState();

// Helper function to convert single transaction to multiple transactions form
const convertTransactionToMultipleForm = (transaction: TransactionFormType): MultipleTransactionsFormData => {
  const groupId = transaction.id || GenerateUuid();
  const transactionId = GenerateUuid();

  return {
    originalTransactionId: transaction.id || null,
    payee: transaction.payee || "",
    date: transaction.date || dayjs().local().format("YYYY-MM-DDTHH:mm:ss"),
    description: transaction.description || "",
    type: transaction.type || "Expense",
    isvoid: transaction.isvoid || false,
    accountid: transaction.accountid || "",
    groupid: groupId,
    transactions: {
      [transactionId]: {
        name: transaction.name || "",
        // Keep the sign — the per-row amount chip derives its color from the sign,
        // so stripping it here made the first row of every expense-split look like income.
        amount: parseFloat(transaction.amount?.toString() || "0") || 0,
        categoryid: transaction.categoryid || "",
        notes: transaction.notes || null,
        tags: transaction.tags || null,
        groupid: groupId,
      },
    },
  };
};

function MultipleTransactions({ transaction }: { transaction: TransactionFormType | null }) {
  const { colors } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Services
  const transactionCategoriesService = useTransactionCategoryService();
  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoriesService.useFindAllWithGroup();
  const accountsService = useAccountService();
  const { data: accounts, isLoading: isAccountsLoading } = accountsService.useFindAllWithCategory();
  const transactionService = useTransactionService();
  const submitAllMutation = transactionService.useCreateMultipleTransactions();
  const splitMutation = transactionService.useSplitTransaction();

  // State for tracking amounts and mode
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  const [maxAmount, setMaxAmount] = useState(0);

  // Multi-currency state
  const { primaryCurrency } = usePrimaryCurrency();
  const [transactionCurrency, setTransactionCurrency] = useState<string>(primaryCurrency || DEFAULT_CURRENCY);
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const hasInitializedCurrencyRef = useRef(false);

  // One-shot init only — never overwrite an explicit user pick (incl. USD).
  useEffect(() => {
    if (hasInitializedCurrencyRef.current) return;
    if (!primaryCurrency) return;
    hasInitializedCurrencyRef.current = true;
    if (transactionCurrency !== primaryCurrency) {
      setTransactionCurrency(primaryCurrency);
    }
  }, [primaryCurrency, transactionCurrency]);

  const isSplitMode = !!transaction && transaction.splitfromid !== null;
  const isForeignCurrency = !isSplitMode && transactionCurrency !== primaryCurrency;
  const { rate: fxRate, isLoading: isFxLoading } = useExchangeRate(transactionCurrency, primaryCurrency);
  const effectiveRate = rateOverride ?? fxRate ?? 1;
  const currencySymbol = getCurrencySymbol(transactionCurrency);

  const handleRateOverride = useCallback((value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "").replace(/\.{2,}/g, ".");
    if (cleaned === "" || cleaned === ".") {
      setRateOverride(null);
      return;
    }
    const parsed = parseFloat(cleaned);
    setRateOverride(isNaN(parsed) ? null : parsed);
  }, []);

  // Create validation schema
  const validationSchema: ValidationSchema<MultipleTransactionsFormData> = useMemo(
    () => ({
      date: createDateValidation(),
      accountid: [commonValidationRules.required("Account is required")],
      type: [commonValidationRules.required("Transaction type is required")],
      description: createDescriptionValidation(false),
      groupid: [commonValidationRules.required("Group ID is required")],
    }),
    [],
  );

  // Initialize form data from props
  const initialFormData = useMemo(
    () => (transaction ? convertTransactionToMultipleForm(transaction) : initialMultipleTransactionsState),
    [transaction],
  );

  // Initialize form state
  const { formState, updateField, setFieldTouched, validateForm, resetForm, setFormData, isValid, isDirty } =
    useFormState<MultipleTransactionsFormData>(initialFormData, validationSchema);

  const isDataLoading = isCategoriesLoading || isAccountsLoading;

  // Initialize mode and maxAmount when transaction changes. A brand-new (non-split, zero-amount)
  // form has no sign to infer, so fall back to the type's usual sign (Expense → minus) instead of
  // always defaulting to "plus" — otherwise a fresh Expense form shows a green "+" total.
  useEffect(() => {
    if (transaction) {
      const signedAmount = parseFloat(transaction.amount?.toString() || "0");
      const amount = Math.abs(signedAmount);
      setMode(signedAmount !== 0 ? (signedAmount < 0 ? "minus" : "plus") : transaction.type === "Income" ? "plus" : "minus");
      setMaxAmount(amount);
    }
  }, [transaction]);

  // Keep the total-amount sign in step with a sensible default when the type changes — the user
  // can still flip it with the mode chip afterward.
  const handleTypeChange = useCallback(
    (type: string) => {
      updateField("type", type);
      setMode(type === "Income" ? "plus" : "minus");
    },
    [updateField],
  );

  // Calculate current total amount from all transactions
  const currentAmount = useMemo(() => {
    return Object.values(formState.data.transactions).reduce((total, transaction) => {
      return total + (Number(transaction.amount) || 0);
    }, 0);
  }, [formState.data.transactions]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: MultipleTransactionsFormData) => {
      const totalAmount = mode === "minus" ? -Math.abs(currentAmount) : Math.abs(currentAmount);

      const rateForSubmit = isForeignCurrency ? effectiveRate : 1;
      // In split mode every child must be active — the parent gets voided server-side and
      // children must never inherit the parent's eventual isvoid=true.
      const childIsVoid = isSplitMode ? false : data.isvoid;

      // Convert form data to array of transaction inserts. We cast via `unknown` because
      //   (a) `tags` is stored as a JSON string in the DB even though the generated row
      //       type says `string[]` (pre-existing), and
      //   (b) `original_amount` / `original_currency` / `exchange_rate` aren't in the
      //       generated Supabase types until the user runs the migration and `npm run supa-gen`.
      const transactions = Object.values(data.transactions).map(trans => {
        const originalAmount = trans.amount ?? 0;
        const convertedAmount = roundToCents(originalAmount * rateForSubmit);
        return {
          payee: data.payee,
          date: data.date,
          description: data.description,
          type: data.type as any,
          isvoid: childIsVoid,
          accountid: data.accountid,
          groupid: data.groupid,
          categoryid: trans.categoryid,
          amount: convertedAmount,
          original_amount: roundToCents(originalAmount),
          original_currency: transactionCurrency,
          exchange_rate: rateForSubmit,
          notes: trans.notes,
          tags: trans.tags ? JSON.stringify(trans.tags) : null,
          name: trans.name,
        };
      }) as unknown as Inserts<TableNames.Transactions>[];

      if (isSplitMode && splitMutation) {
        // Split mode: void original + create children with splitfromid
        await splitMutation.mutateAsync(
          {
            original: {
              id: transaction?.id!,
              accountid: transaction?.accountid!,
              amount:
                mode === "minus"
                  ? -Math.abs(parseFloat(transaction?.amount?.toString() || "0"))
                  : Math.abs(parseFloat(transaction?.amount?.toString() || "0")),
              isvoid: false,
            } as unknown as TransactionsView,
            children: transactions,
          },
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
              router.replace("/Transactions");
            },
          },
        );
      } else {
        // Normal mode: create multiple transactions
        await submitAllMutation.mutateAsync(transactions, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
            router.replace("/Transactions");
          },
        });
      }
    },
    [
      submitAllMutation,
      splitMutation,
      transaction?.id,
      transaction?.accountid,
      transaction?.amount,
      mode,
      currentAmount,
      isSplitMode,
      effectiveRate,
      isForeignCurrency,
      transactionCurrency,
    ],
  );

  // Form submission hook
  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onError: error => {
      console.error("Failed to save multiple transactions:", error);
    },
  });

  // Handle form submission
  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  // Handle form reset
  const handleReset = useCallback(() => {
    resetForm();
    setMaxAmount(0);
  }, [resetForm]);

  // Prepare dropdown options
  const categoryOptions = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter(item => item.name)
      .map(item => ({
        id: item.id,
        label: item.name || "",
        icon: item.icon,
        color: item.color,
        group: item.group?.name || "Uncategorized",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const accountOptions = useMemo(() => {
    if (!accounts) return [];

    return accounts
      .filter(item => item.name)
      .map(item => ({
        id: item.id,
        label: item.name || "",
        value: item.id,
        icon: item.icon,
        color: item.color,
        balance: item.balance,
        group: item.category?.name || "Other",
      }))
      .sort((a, b) => {
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        return a.label.localeCompare(b.label);
      });
  }, [accounts]);

  const selectedAccount = useMemo(
    () => accountOptions.find(a => a.id === formState.data.accountid),
    [accountOptions, formState.data.accountid],
  );

  // Check if amounts balance
  const isBalanced = Math.abs(currentAmount - (mode === "minus" ? -maxAmount : maxAmount)) < 0.01;
  const targetAmount = mode === "minus" ? -maxAmount : maxAmount;
  const remainingAmount = roundToCents(targetAmount - currentAmount);

  if (isDataLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg py-10">
        <Loader />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-4"
        contentContainerStyle={Platform.OS === "web" ? ({ maxWidth: 640, width: "100%", alignSelf: "center" } as any) : undefined}
      >
        <SegmentedControl
          options={[
            { key: "Expense", label: "Expense", tone: "danger" },
            { key: "Income", label: "Income", tone: "success" },
          ]}
          value={formState.data.type}
          onChange={handleTypeChange}
          testID="multi-type"
        />

        <AmountKeypadInput
          label="Total Amount"
          value={maxAmount}
          onChange={value => setMaxAmount(value)}
          mode={mode}
          onModeChange={setMode}
          currencySymbol={currencySymbol}
          testID="multi-total-amount"
        />

        <View className={`${Platform.OS === "web" ? "flex flex-row gap-4" : "gap-4"}`}>
          <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
            <Input
              label="Payee"
              placeholder="Enter payee name"
              value={formState.data.payee}
              onChangeText={value => updateField("payee", value)}
              onBlur={() => setFieldTouched("payee")}
              error={formState.touched.payee ? formState.errors.payee : undefined}
              testID="multi-payee"
            />
          </View>
          <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
            <DateTimePicker
              label="Date"
              value={formState.data.date}
              onChange={iso => updateField("date", dayjs(iso).local().format("YYYY-MM-DDTHH:mm:ss"))}
              testID="multi-date"
            />
          </View>
        </View>

        <View>
          <FormField
            config={{
              name: "accountid",
              label: "Account",
              type: "select",
              required: true,
              options: accountOptions,
              group: "category.name",
              popUp: Platform.OS !== "web",
            }}
            value={formState.data.accountid}
            error={formState.errors.accountid}
            touched={formState.touched.accountid}
            onChange={value => updateField("accountid", value)}
            onBlur={() => setFieldTouched("accountid")}
          />
          {selectedAccount ? (
            <Text className="mt-1.5 text-caption text-ink-mute">
              Balance: {formatMoney(selectedAccount.balance, primaryCurrency)}
            </Text>
          ) : null}
        </View>

        <Input
          label="Description"
          placeholder="Enter description"
          value={formState.data.description}
          onChangeText={value => updateField("description", value)}
          onBlur={() => setFieldTouched("description")}
          error={formState.touched.description ? formState.errors.description : undefined}
          testID="multi-description"
        />

        {/* Advanced (currency/FX — hidden in split mode, which always uses the primary currency) */}
        {!isSplitMode && (
          <View className="rounded-xl border border-border bg-surface">
            <Pressable
              onPress={() => setShowAdvanced(s => !s)}
              accessibilityRole="button"
              testID="multi-advanced-toggle"
              className="flex-row items-center justify-between px-4 py-3.5 active:opacity-80"
            >
              <Text className="text-body text-ink">Advanced</Text>
              <MyIcon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={18} color={colors.inkMute} />
            </Pressable>
            {showAdvanced ? (
              <View className="gap-4 px-4 pb-4">
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
                    <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                      <FormField
                        config={{
                          name: "rate",
                          label: `Rate (1 ${transactionCurrency} → ${primaryCurrency})`,
                          type: "number",
                          placeholder: isFxLoading ? "Loading…" : "0.00",
                          description: isFxLoading
                            ? "Fetching rate…"
                            : `Total ≈ ${formatMoney(currentAmount * effectiveRate, primaryCurrency)}`,
                        }}
                        value={effectiveRate?.toString() ?? ""}
                        onChange={handleRateOverride}
                      />
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Individual transactions */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Transactions</Text>
            <Button
              label="Add"
              variant="secondary"
              size="sm"
              leadingIcon="Plus"
              onPress={() =>
                updateField("transactions", {
                  ...formState.data.transactions,
                  [GenerateUuid()]: (() => {
                    const remaining = roundToCents(targetAmount - currentAmount);
                    const existingRows = Object.values(formState.data.transactions) as MultipleTransactionItemData[];
                    const lastCategoryId = [...existingRows].reverse().find(r => r?.categoryid)?.categoryid || "";
                    const newRow: MultipleTransactionItemData = {
                      name: "",
                      amount: remaining,
                      categoryid: lastCategoryId,
                      notes: null,
                      tags: null,
                      groupid: formState.data.groupid,
                    };
                    return newRow;
                  })(),
                })
              }
              testID="btn-add-transaction"
            />
          </View>

          {Object.entries(formState.data.transactions).map(([id, item]) => (
            <TransactionRow
              key={id}
              id={id}
              transaction={item}
              transactions={formState.data.transactions}
              updateField={updateField}
              categoryOptions={categoryOptions}
              parentMode={mode}
              canDelete={Object.keys(formState.data.transactions).length > 1}
            />
          ))}
        </View>

        {/* Summary */}
        <View className="gap-2 rounded-xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-body text-ink-mute">Target Total</Text>
            <Text className="font-mono-semibold text-body text-ink">{formatMoney(targetAmount, transactionCurrency)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-body text-ink-mute">Current Total</Text>
            <Text className="font-mono-semibold text-body text-ink">{formatMoney(currentAmount, transactionCurrency)}</Text>
          </View>
          <View className="h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text className="text-body text-ink-mute">Remaining</Text>
            <Text className={`font-mono-semibold text-body ${isBalanced ? "text-success" : "text-danger"}`}>
              {formatMoney(remainingAmount, transactionCurrency, { signed: true })}
            </Text>
          </View>
          <View className={`mt-1 rounded-lg p-2 ${isBalanced ? "bg-success-soft" : "bg-danger-soft"}`}>
            <Text className={`text-center text-caption ${isBalanced ? "text-success" : "text-danger"}`}>
              {isBalanced ? "✓ Transactions are balanced" : "⚠ Transactions need to be balanced"}
            </Text>
          </View>
        </View>

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">Error: {error.message}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-end gap-3">
          {isDirty ? (
            <Button label="Reset" variant="outline" onPress={handleReset} disabled={isSubmitting} testID="multi-reset" />
          ) : null}
          <Button
            label={isSubmitting ? "Saving..." : isSplitMode ? "Split Transaction" : "Save Multiple Transactions"}
            onPress={onSubmit}
            disabled={!isValid || !isBalanced || isSubmitting}
            loading={isSubmitting}
            leadingIcon="Check"
            testID="multi-submit"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TransactionRow = ({
  id,
  transaction,
  transactions,
  updateField,
  categoryOptions,
  parentMode,
  canDelete,
}: {
  id: string;
  transaction: MultipleTransactionItemData;
  transactions: Record<string, MultipleTransactionItemData>;
  updateField: (field: any, value: any) => void;
  categoryOptions: { id: string; label: string; icon?: string | null; color?: string | null; group: string }[];
  parentMode: "plus" | "minus";
  canDelete: boolean;
}) => {
  // A fresh row's amount is exactly 0 (no sign of its own yet) — default its chip to the
  // group's overall sign so typing a number doesn't silently go the wrong direction.
  const rowMode: "plus" | "minus" =
    transaction.amount ? (transaction.amount < 0 ? "minus" : "plus") : Object.is(transaction.amount, -0) ? "minus" : parentMode;

  const updateRow = useCallback(
    (field: keyof MultipleTransactionItemData, value: any) => {
      updateField("transactions", { ...transactions, [id]: { ...transactions[id], [field]: value } });
    },
    [transactions, id, updateField],
  );

  const handleDelete = useCallback(() => {
    if (!canDelete) return;
    const { [id]: _removed, ...rest } = transactions;
    updateField("transactions", rest);
  }, [canDelete, transactions, id, updateField]);

  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4" testID={`multi-row-${id}`}>
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <GroupedInput
            label="Amount"
            amount={transaction.amount ?? 0}
            onChange={value => updateRow("amount", value)}
            mode={rowMode}
            showCalculator={false}
            inputTestID={`multi-row-${id}-amount`}
          />
        </View>
        {canDelete && (
          <IconButton
            icon="Trash2"
            variant="ghost"
            haptic="medium"
            className="mt-6"
            onPress={handleDelete}
            accessibilityLabel="Delete transaction"
            testID={`multi-row-${id}-delete`}
          />
        )}
      </View>

      <Input
        label="Name"
        placeholder="Enter transaction name"
        value={transaction.name || ""}
        onChangeText={value => updateRow("name", value)}
        testID={`multi-row-${id}-name`}
      />

      <GroupedIconSelect
        label="Category"
        options={categoryOptions}
        value={transaction.categoryid || null}
        onChange={value => updateRow("categoryid", value)}
        testID={`multi-row-${id}-category`}
      />

      <Input
        label="Notes"
        placeholder="Optional notes"
        multiline
        value={transaction.notes || ""}
        onChangeText={value => updateRow("notes", value || null)}
        testID={`multi-row-${id}-notes`}
      />

      <Input
        label="Tags"
        placeholder="Enter tags separated by commas"
        value={Array.isArray(transaction.tags) ? transaction.tags.join(", ") : ""}
        onChangeText={value =>
          updateRow(
            "tags",
            value
              .split(",")
              .map(t => t.trim())
              .filter(Boolean),
          )
        }
        testID={`multi-row-${id}-tags`}
      />
    </View>
  );
};

export default memo(MultipleTransactions);
