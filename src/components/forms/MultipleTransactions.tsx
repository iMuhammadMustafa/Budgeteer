import dayjs from "dayjs";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../elements/Button";

import {
  MultipleTransactionItemData,
  MultipleTransactionsFormData,
  OptionItem,
  ValidationSchema,
} from "@/src/types/components/forms.types";

import { queryClient } from "@/src/providers/QueryProvider";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useExchangeRate } from "@/src/services/Fx.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionsView } from "@/src/types/database/Tables.Types";
import { roundToCents } from "@/src/utils/amount.helper";
import { currencyDropdownOptions, DEFAULT_CURRENCY, formatMoney } from "@/src/utils/currency";
import { commonValidationRules, createDateValidation, createDescriptionValidation } from "@/src/utils/form-validation";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { router } from "expo-router";
import ModeIcon from "../elements/ModeIcon";
import MyIcon from "../elements/MyIcon";
import FormContainer from "../form-builder/FormContainer";
import FormField from "../form-builder/FormField";
import FormSection from "../form-builder/FormSection";
import { useFormState, useFormSubmission } from "../form-builder/hooks";
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
        // Keep the sign — the per-row ModeIcon derives its chip color from the amount's sign,
        // so stripping it here made the first row of every expense-split look like income.
        amount: transaction.amount || 0,
        categoryid: transaction.categoryid || "",
        notes: transaction.notes || null,
        tags: transaction.tags || null,
        groupid: groupId,
      },
    },
  };
};

function MultipleTransactions({ transaction }: { transaction: TransactionFormType | null }) {
  // Services
  const transactionCategoriesService = useTransactionCategoryService();
  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoriesService.useFindAll();
  const accountsService = useAccountService();
  const { data: accounts, isLoading: isAccountsLoading } = accountsService.useFindAll();
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
      payee: [commonValidationRules.required("Payee is required")],
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

  // Initialize mode and maxAmount when transaction changes
  useEffect(() => {
    if (transaction) {
      const amount = Math.abs(parseFloat(transaction.amount?.toString() || "0"));
      setMode(parseFloat(transaction.amount?.toString() || "0") < 0 ? "minus" : "plus");
      setMaxAmount(amount);
    }
  }, [transaction]);

  // Calculate current total amount from all transactions
  const currentAmount = useMemo(() => {
    return Object.values(formState.data.transactions).reduce((total, transaction) => {
      return total + (transaction.amount || 0);
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
              console.log({ message: "Transaction split successfully", type: "success" });
              await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
              router.replace("/Transactions");
            },
          },
        );
      } else {
        // Normal mode: create multiple transactions
        await submitAllMutation.mutateAsync(transactions, {
          onSuccess: async () => {
            console.log({
              message: `Transaction ${transaction?.id ? "Updated" : "Created"} Successfully`,
              type: "success",
            });
            await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
            router.replace("/Transactions");
          },
        });
      }
    },
    [submitAllMutation, splitMutation, transaction?.id, transaction?.accountid, transaction?.amount, mode, currentAmount, isSplitMode, effectiveRate, isForeignCurrency, transactionCurrency],
  );

  // Form submission hook
  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Multiple transactions saved successfully");
    },
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
        value: item.id,
        icon: item.icon,
        color: item.color,
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
        group: item.category?.name || "Other",
      }))
      .sort((a, b) => {
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        return a.label.localeCompare(b.label);
      });
  }, [accounts]);

  const transactionTypeOptions: OptionItem[] = [
    { id: "income", label: "Income", value: "Income" },
    { id: "expense", label: "Expense", value: "Expense" },
  ];

  // Handle mode toggle
  const handleModeToggle = useCallback(() => {
    setMode(prevMode => (prevMode === "plus" ? "minus" : "plus"));
  }, []);

  // Handle max amount change
  const handleMaxAmountChange = useCallback((value: string) => {
    let cleanValue = value
      .replace(/[^0-9.-]/g, "")
      .replace(/(?!^)-/g, "")
      .replace(/\.{2,}/g, ".")
      .replace(/^0+(?=\d)/, "");

    if (cleanValue.startsWith("-")) {
      setMode("minus");
      cleanValue = cleanValue.replace("-", "");
    }

    if (cleanValue.includes(".")) {
      const parts = cleanValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        cleanValue = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    const numericAmount = parseFloat(cleanValue) || 0;

    if (numericAmount <= 999999999.99) {
      setMaxAmount(numericAmount);
    }
  }, []);

  // Check if amounts balance
  const isBalanced = Math.abs(currentAmount - (mode === "minus" ? -maxAmount : maxAmount)) < 0.01;

  return (
    <SafeAreaView className="flex-1">
      {isDataLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 text-foreground">Loading...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <FormContainer
            onSubmit={onSubmit}
            isValid={isValid && isBalanced && !isSubmitting}
            isLoading={isSubmitting}
            submitLabel={isSplitMode ? "Split Transaction" : "Save Multiple Transactions"}
            showReset={isDirty}
            onReset={handleReset}
          >
            {/* Basic Information Section */}
            <FormSection
              title="Transaction Group Details"
              description="Enter the common information for all transactions"
            >
              <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
                <FormField
                  config={{
                    name: "payee",
                    label: "Payee",
                    type: "text",
                    required: true,
                    placeholder: "Enter payee name",
                  }}
                  value={formState.data.payee}
                  error={formState.errors.payee}
                  touched={formState.touched.payee}
                  onChange={value => updateField("payee", value)}
                  onBlur={() => setFieldTouched("payee")}
                  className="flex-1"
                />

                <FormField
                  config={{
                    name: "description",
                    label: "Description",
                    type: "text",
                    placeholder: "Enter description",
                  }}
                  value={formState.data.description}
                  error={formState.errors.description}
                  touched={formState.touched.description}
                  onChange={value => updateField("description", value)}
                  onBlur={() => setFieldTouched("description")}
                  className="flex-1"
                />
              </View>

              <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
                {/* Total Amount with Mode Toggle */}
                <View className="flex-1 flex-row items-center">
                  <View className="me-2 mt-5 justify-center items-center">
                    <ModeIcon onPress={handleModeToggle} mode={mode} />
                  </View>

                  <View className="flex-1">
                    <FormField
                      config={{
                        name: "totalAmount",
                        label: "Total Amount",
                        type: "number",
                        required: true,
                        placeholder: "0.00",
                      }}
                      value={maxAmount.toString()}
                      onChange={handleMaxAmountChange}
                      className="flex-1"
                    />
                  </View>
                </View>

                <FormField
                  config={{
                    name: "date",
                    label: "Date",
                    type: "date",
                    required: true,
                  }}
                  value={formState.data.date}
                  error={formState.errors.date}
                  touched={formState.touched.date}
                  onChange={value => {
                    if (value) {
                      const formattedDate = dayjs(value).local().format("YYYY-MM-DDTHH:mm:ss");
                      updateField("date", formattedDate);
                    }
                  }}
                  onBlur={() => setFieldTouched("date")}
                  className="flex-1"
                />
              </View>

              <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
                <FormField
                  config={{
                    name: "type",
                    label: "Type",
                    type: "select",
                    required: true,
                    options: transactionTypeOptions,
                  }}
                  value={formState.data.type}
                  error={formState.errors.type}
                  touched={formState.touched.type}
                  onChange={value => updateField("type", value)}
                  onBlur={() => setFieldTouched("type")}
                  className="flex-1"
                />

                <FormField
                  config={{
                    name: "accountid",
                    label: "Account",
                    type: "select",
                    required: true,
                    options: accountOptions,
                  }}
                  value={formState.data.accountid}
                  error={formState.errors.accountid}
                  touched={formState.touched.accountid}
                  onChange={value => updateField("accountid", value)}
                  onBlur={() => setFieldTouched("accountid")}
                  className="flex-1"
                />
              </View>

              {!isSplitMode && (
                <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
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
                    className="flex-1"
                  />
                  {isForeignCurrency && (
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
                      className="flex-1"
                    />
                  )}
                </View>
              )}
            </FormSection>

            {/* Transactions List Section */}
            <FormSection
              title="Individual Transactions"
              description="Break down the total amount into individual transactions"
            >
              <TransactionsCreationList
                formState={formState}
                updateField={updateField}
                setFieldTouched={setFieldTouched}
                maxAmount={maxAmount}
                currentAmount={currentAmount}
                categoryOptions={categoryOptions}
                mode={mode}
              />
            </FormSection>

            {/* Summary Section */}
            <FormSection title="Summary">
              <TransactionsSummary
                maxAmount={maxAmount}
                currentAmount={currentAmount}
                mode={mode}
                isBalanced={isBalanced}
              />
            </FormSection>

            {/* Display submission error if any */}
            {error && (
              <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <Text className="text-status-danger text-sm">Error: {error.message}</Text>
              </View>
            )}
          </FormContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const TransactionsCreationList = ({
  formState,
  updateField,
  setFieldTouched,
  maxAmount,
  currentAmount,
  categoryOptions,
  mode,
}: {
  formState: any;
  updateField: (field: any, value: any) => void;
  setFieldTouched: (field: any) => void;
  maxAmount: number;
  currentAmount: number;
  categoryOptions: OptionItem[];
  mode: "plus" | "minus";
}) => {
  const transactionIds = Object.keys(formState.data.transactions);

  // Add new transaction
  const addNewTransaction = useCallback(() => {
    const newTransactionId = GenerateUuid();
    // Round to cents so we never carry float drift (e.g. 0.000000000001) into the new row.
    const signedMax = mode === "minus" ? -maxAmount : maxAmount;
    const remainingAmount = roundToCents(signedMax - currentAmount);

    let initialAmount: number = remainingAmount;
    if (remainingAmount === 0 && mode === "minus") {
      initialAmount = -0;
    }

    // Inherit the category from the most recently added row so users splitting a receipt
    // into similar items don't have to repick the category every time.
    const existingRows = Object.values(formState.data.transactions) as MultipleTransactionItemData[];
    const lastCategoryId = [...existingRows].reverse().find(r => r?.categoryid)?.categoryid || "";

    const newTransaction: MultipleTransactionItemData = {
      name: "",
      amount: initialAmount,
      categoryid: lastCategoryId,
      notes: null,
      tags: null,
      groupid: formState.data.groupid,
    };

    updateField("transactions", {
      ...formState.data.transactions,
      [newTransactionId]: newTransaction,
    });
  }, [formState.data.transactions, formState.data.groupid, updateField, maxAmount, currentAmount, mode]);

  return (
    <View className="space-y-4">
      {/* Add New Transaction Button */}
      <Button
        variant="primary"
        size="md"
        hapticFeedback="light"
        className="p-3 bg-primary-500 rounded-md flex-row items-center justify-center"
        onPress={addNewTransaction}
        accessibilityLabel="Add new transaction"
        testID="btn-add-transaction"
      >
        <MyIcon name="Plus" size={20} className="text-white mr-2" />
        <Text className="text-white font-medium">Add Transaction</Text>
      </Button>

      {/* Transactions List */}
      <ScrollView
        className={`${Platform.OS === "web" ? "max-h-[400px]" : "max-h-[450px]"}`}
        showsVerticalScrollIndicator={true}
      >
        {transactionIds.map((transactionId, index) => (
          <TransactionCard
            key={transactionId}
            id={transactionId}
            transaction={formState.data.transactions[transactionId]}
            formState={formState}
            updateField={updateField}
            setFieldTouched={setFieldTouched}
            categoryOptions={categoryOptions}
            maxAmount={maxAmount}
            currentAmount={currentAmount}
            mode={mode}
            canDelete={transactionIds.length > 1}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const TransactionCard = ({
  id,
  transaction,
  formState,
  updateField,
  setFieldTouched,
  categoryOptions,
  maxAmount,
  currentAmount,
  mode,
  canDelete,
}: {
  id: string;
  transaction: MultipleTransactionItemData;
  formState: any;
  updateField: (field: any, value: any) => void;
  setFieldTouched: (field: any) => void;
  categoryOptions: OptionItem[];
  maxAmount: number;
  currentAmount: number;
  mode: "plus" | "minus";
  canDelete: boolean;
}) => {
  // Update a specific transaction field
  const updateTransactionField = useCallback(
    (field: keyof MultipleTransactionItemData, value: any) => {
      const updatedTransactions = {
        ...formState.data.transactions,
        [id]: {
          ...formState.data.transactions[id],
          [field]: value,
        },
      };
      updateField("transactions", updatedTransactions);
    },
    [formState.data.transactions, id, updateField],
  );

  // Handle amount change with validation
  const handleAmountChange = useCallback(
    (value: string) => {
      let cleanValue = value
        .replace(/[^0-9.]/g, "")
        .replace(/\.{2,}/g, ".")
        .replace(/^0+(?=\d)/, "");

      if (cleanValue.includes(".")) {
        const parts = cleanValue.split(".");
        if (parts[1] && parts[1].length > 2) {
          cleanValue = parts[0] + "." + parts[1].substring(0, 2);
        }
      }

      const numericAmount = parseFloat(cleanValue) || 0;

      // Keep the current sign
      const isNegative = (transaction.amount ?? 0) < 0 || Object.is(transaction.amount, -0);
      const finalAmount = isNegative ? -numericAmount : numericAmount;

      updateTransactionField("amount", finalAmount);
    },
    [transaction.amount, updateTransactionField],
  );

  // Handle transaction deletion
  const handleDelete = useCallback(() => {
    if (!canDelete) return;

    const { [id]: deletedTransaction, ...remainingTransactions } = formState.data.transactions;
    updateField("transactions", remainingTransactions);
  }, [canDelete, formState.data.transactions, id, updateField]);

  return (
    <View
      className={`bg-card border border-muted rounded-lg p-4 mb-4 ${Platform.OS === "web" ? "flex-row gap-4 items-start" : "space-y-3"}`}
    >
      {/* Amount Field */}
      <View className={Platform.OS === "web" ? "flex-1 flex-row gap-2 items-center" : "flex-row gap-2 items-center"}>
        <View className="mt-5 justify-center">
          <ModeIcon
            onPress={() => updateTransactionField("amount", -(transaction.amount ?? 0))}
            mode={(transaction.amount ?? 0) < 0 || Object.is(transaction.amount, -0) ? "minus" : "plus"}
          />
        </View>
        <FormField
          config={{
            name: "amount",
            label: "Amount",
            type: "number",
            required: true,
            placeholder: "0.00",
          }}
          value={Math.abs(transaction.amount ?? 0).toString() || "0"}
          onChange={handleAmountChange}
          className="flex-1"
        />
      </View>

      {/* Name Field */}
      <FormField
        config={{
          name: "name",
          label: "Transaction Name",
          type: "text",
          required: true,
          placeholder: "Enter transaction name",
        }}
        value={transaction.name || ""}
        onChange={value => updateTransactionField("name", value)}
        onBlur={() => setFieldTouched(`transactions.${id}.name`)}
        className={Platform.OS === "web" ? "flex-1" : ""}
      />

      {/* Category Field */}
      <FormField
        config={{
          name: "categoryid",
          label: "Category",
          type: "select",
          required: true,
          options: categoryOptions,
        }}
        value={transaction.categoryid || ""}
        onChange={value => updateTransactionField("categoryid", value)}
        onBlur={() => setFieldTouched(`transactions.${id}.categoryid`)}
        className={Platform.OS === "web" ? "flex-1" : ""}
      />

      {/* Notes Field — kept compact: this card already has Amount/Name/Category above it */}
      <FormField
        config={{
          name: "notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Optional notes",
        }}
        value={transaction.notes || ""}
        onChange={value => updateTransactionField("notes", value)}
        onBlur={() => setFieldTouched(`transactions.${id}.notes`)}
        className={`${Platform.OS === "web" ? "flex-1" : ""} min-h-[40px] max-h-[80px]`}
      />

      {/* Tags Field */}
      <FormField
        config={{
          name: "tags",
          label: "Tags",
          type: "multiselect",
          placeholder: "Enter tags separated by commas",
        }}
        value={transaction.tags}
        onChange={value =>
          updateTransactionField("tags", Array.isArray(value) ? value : value?.split(",").filter(Boolean))
        }
        onBlur={() => setFieldTouched(`transactions.${id}.tags`)}
        className={Platform.OS === "web" ? "flex-1" : ""}
      />

      {/* Delete Button */}
      {canDelete && (
        <Button
          variant="destructive"
          size="icon"
          hapticFeedback="medium"
          className="bg-red-500 hover:bg-red-600 rounded-md p-2 mt-2 self-start"
          onPress={handleDelete}
          accessibilityLabel="Delete transaction"
          testID="btn-delete-transaction"
        >
          <MyIcon name="Trash" size={20} className="text-white" />
        </Button>
      )}
    </View>
  );
};

const TransactionsSummary = ({
  maxAmount,
  currentAmount,
  mode,
  isBalanced,
}: {
  maxAmount: number;
  currentAmount: number;
  mode: "plus" | "minus";
  isBalanced: boolean;
}) => {
  const targetAmount = mode === "minus" ? -maxAmount : maxAmount;
  const remainingAmount = targetAmount - currentAmount;

  return (
    <View className="bg-surface-elevated p-4 rounded-lg border border-border-default">
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-foreground font-medium">Target Total:</Text>
          <Text className="text-foreground font-bold">{targetAmount.toFixed(2)}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-foreground font-medium">Current Total:</Text>
          <Text className="text-foreground font-bold">{currentAmount.toFixed(2)}</Text>
        </View>

        <View className="flex-row justify-between border-t border-border-default pt-2">
          <Text className="text-foreground font-medium">Remaining:</Text>
          <Text
            className={`font-bold ${Math.abs(remainingAmount) < 0.01 ? "text-status-success" : "text-status-warning"}`}
          >
            {remainingAmount.toFixed(2)}
          </Text>
        </View>

        {/* Balance Status */}
        <View
          className="mt-3 p-2 rounded-md bg-opacity-20"
          style={{
            backgroundColor: isBalanced ? "#10b981" : "#f59e0b",
          }}
        >
          <Text className={`text-center font-medium ${isBalanced ? "text-status-success" : "text-status-warning"}`}>
            {isBalanced ? "✓ Transactions are balanced" : "⚠ Transactions need to be balanced"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default memo(MultipleTransactions);
