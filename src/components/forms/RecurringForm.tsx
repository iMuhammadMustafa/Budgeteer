import { useAccountService } from "@/src/services/Accounts.Service";
import {
  parseRecurrenceRule,
  RecurrenceFrequency,
  RecurringType,
  useRecurringService,
} from "@/src/services/Recurrings.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.Types";
import { OptionItem } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Recurring, TransactionType, Updates } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";
import {
  AccountSelecterDropdown,
  Button,
  DateTimePicker,
  GroupedInput,
  Input,
  MyCategoriesDropdown,
  type SearchableSelectOption,
  SearchableSelect,
  Select,
  type SelectOption,
  Switch,
} from "@/src/components/ui";

type RecurringFormType = Omit<Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings>, "recurrencerule"> & {
  frequency: RecurrenceFrequency;
  interval: number;
  type: TransactionType; // Added type field
  transferaccountid?: string | null; // For transfer transactions
  recurringType: RecurringType; // Standard, Transfer, CreditCardPayment
  autoApplyEnabled: boolean; // Individual auto-apply setting
  isAmountFlexible: boolean; // Allow transactions without predefined amount
  isDateFlexible: boolean; // Allow transactions without predefined date
  recurrencerule?: string; // Will be constructed
};

const recurrenceFrequencyOptions: OptionItem[] = [
  { id: "DAILY", label: "Daily", value: "DAILY" },
  { id: "WEEKLY", label: "Weekly", value: "WEEKLY" },
  { id: "MONTHLY", label: "Monthly", value: "MONTHLY" },
  { id: "YEARLY", label: "Yearly", value: "YEARLY" },
];

const recurringTypeOptions: OptionItem[] = [
  { id: "Expense", label: "Expense", value: "Expense" },
  { id: "Income", label: "Income", value: "Income" },
  { id: "Transfer", label: "Transfer", value: "Transfer" },
];

const recurringCategoryOptions: OptionItem[] = [
  { id: RecurringType.Standard, label: "Standard Transaction", value: RecurringType.Standard },
  { id: RecurringType.Transfer, label: "Account Transfer", value: RecurringType.Transfer },
  // { id: RecurringType.CreditCardPayment, label: "Credit Card Payment", value: RecurringType.CreditCardPayment },
];

// DropdownField → ui Select bridges: legacy options carry the stored value on
// `.value` and key on `.id`; Select keys/values on a string id and reports back
// that id, so these map between the two shapes (preserving the original
// `onSelect(item)` handlers, which still receive the legacy OptionItem).
const toSelectOptions = (options: OptionItem[]): SelectOption[] =>
  options.map(o => ({
    id: String(o.id),
    label: o.label,
    value: o.value,
    icon: o.icon,
    iconColor: o.color,
    group: (o as { group?: string }).group,
  }));

const selectIdForValue = (options: OptionItem[], selectedValue: unknown): string | null => {
  const match = options.find(o => o.value === selectedValue);
  return match ? String(match.id) : null;
};

const optionForId = (options: OptionItem[], id: string | string[] | null): OptionItem | null => {
  if (id == null) return null;
  const key = Array.isArray(id) ? id[0] : id;
  return options.find(o => String(o.id) === key) ?? null;
};

export const initialRecurringState: RecurringFormType = {
  name: "",
  description: undefined,
  nextoccurrencedate: dayjs().local().format("YYYY-MM-DD"),
  type: "Expense", // Default type
  // recurrencerule: "FREQ=MONTHLY;INTERVAL=1", // Default to monthly - will be constructed
  frequency: "MONTHLY",
  interval: 1,
  enddate: undefined,
  amount: 0,
  currencycode: "USD",
  sourceaccountid: "",
  transferaccountid: null,
  recurringType: RecurringType.Standard, // Default to standard
  autoApplyEnabled: false, // Default to manual
  isAmountFlexible: false, // Default to fixed amount
  isDateFlexible: false, // Default to fixed date
  categoryid: undefined,
  payeename: undefined,
  notes: undefined,
  isactive: true,
  lastexecutedat: undefined,
  tenantid: "", // Will be overridden by session, but required by type
  // Standard fields will be set by hooks/API
  // id: undefined, // Handled by Supabase or edit mode
  // created_by: undefined,
  // created_at: undefined,
  // updated_by: undefined,
  // updated_at: undefined,
  // is_deleted: false,
};

export default function RecurringForm({ recurring }: { recurring: any }) {
  const {
    mode,
    setMode,
    formData,
    setFormData,
    isEdit,
    isLoading,
    isSubmitting,
    categories,
    accounts,
    blueprintLabel,
    handleTextChange,
    handleDateChange,
    handleSwitchChange,
    handleBlueprintTransactionSelect,
    handleSubmit,
    handleCancel,
    handleModeToggle,
  } = useRecurringForm(recurring);

  const transactionService = useTransactionService();

  // SearchableDropdown → SearchableSelect: the legacy searchAction received
  // (text, tenantId); useFindByName already captures tenantId in its service
  // closure and ignores the second arg, so the new (query)-only signature wraps
  // it directly. Results ({label, item}) map to SearchableSelectOption; on
  // select we reconstruct the legacy {label, item} shape for the handler.
  const blueprintSearch = async (query: string): Promise<SearchableSelectOption[]> => {
    const results = await transactionService.useFindByName(query);
    return results.map((r, i) => ({
      id: `${r.label}-${i}`,
      label: r.label,
      value: r.item,
    }));
  };

  if (isLoading) return <ActivityIndicator className="flex-1 justify-center items-center" />;

  return (
    <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
      {!isEdit && (
        <SearchableSelect
          label="Blueprint Transaction (Optional)"
          placeholder="Search transaction by name..."
          searchAction={blueprintSearch}
          onSelect={option => handleBlueprintTransactionSelect({ label: option.label, item: option.value })}
          selectedLabel={blueprintLabel}
          present={Platform.OS !== "web" ? "sheet" : undefined}
          className="my-1"
        />
      )}

      <Input
        label="Name"
        value={formData.name}
        onChangeText={text => handleTextChange("name", text)}
        placeholder="e.g., Rent Payment"
      />
      <Input
        label="Description"
        value={formData.description ?? ""}
        onChangeText={text => handleTextChange("description", text)}
        placeholder="e.g., Monthly apartment rent"
        multiline
      />
      <Select
        label="Recurring Category"
        options={toSelectOptions(recurringCategoryOptions)}
        value={selectIdForValue(recurringCategoryOptions, formData.recurringType)}
        onChange={id => {
          const item = optionForId(recurringCategoryOptions, id);
          if (item) {
            handleTextChange("recurringType", item.id as RecurringType);
          }
        }}
        present={Platform.OS !== "web" ? "sheet" : undefined}
      />

      {formData.recurringType === RecurringType.Standard && (
        <Select
          label="Transaction Type"
          options={toSelectOptions(recurringTypeOptions)}
          value={selectIdForValue(recurringTypeOptions, formData.type)}
          onChange={id => {
            const item = optionForId(recurringTypeOptions, id);
            if (item) {
              handleTextChange("type", item.id as TransactionType);
            }
          }}
          present={Platform.OS !== "web" ? "sheet" : undefined}
        />
      )}

      <View className="flex-row justify-between items-center my-3 p-3 border border-border-default rounded-md">
        <Text className="text-foreground">Flexible Date (Manual Scheduling)</Text>
        <Switch
          value={!!formData.isDateFlexible}
          onValueChange={value => handleSwitchChange("isDateFlexible", value)}
          testID="switch-flexible-date"
        />
      </View>

      {!formData.isDateFlexible && (
        <>
          <DateTimePicker
            label="Next Occurrence Date"
            value={formData.nextoccurrencedate ? dayjs(formData.nextoccurrencedate).toISOString() : null}
            onChange={isoDateString => handleDateChange("nextoccurrencedate", isoDateString)}
            present={Platform.OS !== "web" ? "sheet" : undefined}
          />
          <Select
            label="Frequency"
            options={toSelectOptions(recurrenceFrequencyOptions)}
            value={selectIdForValue(recurrenceFrequencyOptions, formData.frequency)}
            onChange={id => {
              const item = optionForId(recurrenceFrequencyOptions, id);
              // Handle null item
              if (item) {
                handleTextChange("frequency", item.id as RecurrenceFrequency);
              }
            }}
            present={Platform.OS !== "web" ? "sheet" : undefined}
          />
          <Input
            label="Interval"
            value={formData.interval.toString()}
            onChangeText={text => handleTextChange("interval", parseInt(text, 10) || 1)}
            keyboardType="numeric"
            placeholder="e.g., 1"
          />
        </>
      )}
      <View className="flex-row justify-between items-center my-3 p-3 border border-border-default rounded-md">
        <Text className="text-foreground">Flexible Amount (Enter at Execution)</Text>
        <Switch
          value={!!formData.isAmountFlexible}
          onValueChange={value => handleSwitchChange("isAmountFlexible", value)}
          testID="switch-flexible-amount"
        />
      </View>

      {!formData.isAmountFlexible && (
        <View className="mb-4">
          <GroupedInput
            label="Amount"
            amount={formData.type === "Transfer" ? formData.amount ?? 0 : mode === "minus" ? -(formData.amount ?? 0) : formData.amount ?? 0}
            mode={formData.type === "Transfer" ? "transfer" : mode}
            onChange={value => handleTextChange("amount", Math.abs(value) || 0)}
            onModeChange={newMode => {
              if (newMode === "plus" || newMode === "minus") {
                setMode(newMode);
              }
            }}
            placeholder="e.g., 1200.50"
            inputTestID="amount-input"
          />
        </View>
      )}

      <AccountSelecterDropdown
        label="Source Account"
        selectedValue={formData.sourceaccountid}
        onSelect={accountOption => {
          if (accountOption) {
            handleTextChange("sourceaccountid", accountOption.id);
            // Auto-set currency based on account
            const selectedAccount = accounts?.find((acc: any) => acc.id === accountOption.id);
            if (selectedAccount?.currency) {
              handleTextChange("currencycode", selectedAccount.currency);
            }
          }
        }}
        accounts={accounts}
        isModal={Platform.OS !== "web"}
        groupBy="category.name"
      />

      {formData.recurringType === RecurringType.Transfer && (
        <>
          <AccountSelecterDropdown
            label="To Account (Destination)"
            selectedValue={formData.transferaccountid}
            onSelect={account => handleTextChange("transferaccountid", account?.id || null)}
            accounts={accounts}
            isModal={Platform.OS !== "web"}
            groupBy="category.name"
          />
          {formData.sourceaccountid &&
            formData.transferaccountid &&
            formData.sourceaccountid === formData.transferaccountid && (
              <View className="bg-red-50 p-4 rounded-md border border-red-200">
                <Text className="text-status-danger font-medium">Invalid Configuration</Text>
                <Text className="text-status-danger text-sm">Source and destination accounts must be different.</Text>
              </View>
            )}
        </>
      )}
      {/* // <TextInputField
            //   label="Currency Code"
            //   value={formData.currencycode}
            //   onChange={text => handleTextChange("currencycode", text.toUpperCase())}
            //   placeholder="e.g., USD"
            //   maxLength={3}
            // /> */}

      <MyCategoriesDropdown
        label="Category"
        selectedValue={formData.categoryid}
        categories={categories}
        onSelect={category => handleTextChange("categoryid", category?.id || null)}
        isModal={Platform.OS !== "web"}
        showClearButton={!!formData.categoryid && formData.recurringType !== RecurringType.CreditCardPayment}
        onClear={() => handleTextChange("categoryid", null)}
      />
      <Input
        label="Payee Name (Optional)"
        value={formData.payeename ?? ""}
        onChangeText={text => handleTextChange("payeename", text)}
        placeholder="e.g., Landlord Name"
      />
      <Input
        label="Notes (Optional)"
        value={formData.notes ?? ""}
        onChangeText={text => handleTextChange("notes", text)}
        placeholder="Any additional notes"
        multiline
      />
      {formData.isDateFlexible && formData.isAmountFlexible && (
        <View className="bg-blue-50 p-4 rounded-md border border-blue-200 my-3">
          <Text className="text-status-info font-medium mb-2">Fully Flexible Transaction</Text>
          <Text className="text-status-info text-sm">
            This recurring transaction is fully flexible - you can execute it at any time with any amount. Perfect for
            irregular expenses or income that vary in timing and amount.
          </Text>
        </View>
      )}

      <View className="flex-row text-center justify-around items-center gap-5 mt-5 mb-10">
        <Button
          variant="primary"
          size="lg"
          haptic="success"
          className="px-8 py-3"
          disabled={isSubmitting}
          loading={isSubmitting}
          onPress={handleSubmit}
          label={isEdit ? "Update" : "Save"}
          testID="btn-recurring-submit"
        />
      </View>
    </ScrollView>
  );
}

const useRecurringForm = (recurringToEdit: Recurring | null) => {
  const [formData, setFormData] = useState<RecurringFormType>(initialRecurringState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"plus" | "minus">("minus");
  // SearchableSelect is caller-owned for its display label (async results).
  const [blueprintLabel, setBlueprintLabel] = useState<string | null>(null);

  const recurringService = useRecurringService();
  const transactionCategoriesService = useTransactionCategoryService();
  const accountsService = useAccountService();
  const { data: categories, isLoading: isLoadingCategories } = transactionCategoriesService.useFindAll();
  const { data: accounts, isLoading: isLoadingAccounts } = accountsService.useFindAll();

  const { mutate: upsertRecurring } = recurringService.useUpsert();

  const isEdit = !!recurringToEdit?.id;
  const isLoading = isLoadingCategories || isLoadingAccounts;

  useEffect(() => {
    if (isEdit && recurringToEdit) {
      const { freq, interval: interv } = parseRecurrenceRule(recurringToEdit.recurrencerule);

      setFormData({
        ...(recurringToEdit as any), // Cast to any to allow additional form fields like frequency, interval
        amount: Math.abs(recurringToEdit.amount || 0), // Ensure amount is positive for form
        type: (recurringToEdit.type as TransactionType) || "Expense", // Set type, default if not present
        frequency: freq,
        interval: interv,
        recurringType: recurringToEdit.recurringtype || RecurringType.Standard,
        autoApplyEnabled: recurringToEdit.autoapplyenabled || false,
        isAmountFlexible: recurringToEdit.isamountflexible || false,
        isDateFlexible: recurringToEdit.isdateflexible || false,
        transferaccountid: recurringToEdit.transferaccountid || null,
        nextoccurrencedate: dayjs(recurringToEdit.nextoccurrencedate).format("YYYY-MM-DD"),
        enddate: recurringToEdit.enddate ? dayjs(recurringToEdit.enddate).format("YYYY-MM-DD") : null,
      });
      setMode(recurringToEdit.amount && recurringToEdit.amount < 0 ? "minus" : "plus");
    } else if (!isEdit) {
      setFormData({ ...initialRecurringState });
    }
  }, [recurringToEdit, isEdit]);

  const handleTextChange = (
    name: keyof RecurringFormType,
    value: string | number | boolean | null | string[] | RecurrenceFrequency | TransactionType | RecurringType,
  ) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };

      // Handle recurring type changes
      if (name === "recurringType") {
        if (value === RecurringType.Transfer) {
          newState.type = "Transfer";
          newState.categoryid = null as any; // Transfers don't have categories
        } else if (value === RecurringType.CreditCardPayment) {
          newState.type = "Transfer"; // Credit card payments are transfers
          newState.isAmountFlexible = true; // Credit card payments always have flexible amounts
          newState.amount = null; // Clear amount as it will be calculated at execution
          // Keep categoryid as it's required for credit card payments
        } else {
          // Standard recurring transaction
          newState.transferaccountid = undefined;
        }
      }

      // Handle transaction type changes
      if (name === "type") {
        if (value === "Transfer") {
          newState.categoryid = undefined; // Transfers don't have categories
        } else {
          newState.transferaccountid = null; // Other types don't have a destination account
        }
      }
      if (name === "type") {
        if (value === "Income") {
          setMode("plus");
        } else {
          setMode("minus");
        }
      }

      // Handle flexible amount/date changes
      if (name === "isAmountFlexible" && value === true) {
        newState.amount = null; // Clear amount if flexible
      }

      if (name === "isDateFlexible" && value === true) {
        newState.nextoccurrencedate = ""; // Clear date if flexible
        newState.frequency = "MONTHLY"; // Reset to default
        newState.interval = 1;
      }

      return newState;
    });
  };

  const handleDateChange = (
    name: keyof Pick<RecurringFormType, "nextoccurrencedate" | "enddate">,
    isoDateString: string | null,
  ) => {
    setFormData(prev => ({ ...prev, [name]: isoDateString ? dayjs(isoDateString).format("YYYY-MM-DD") : null }));
  };

  const handleSwitchChange = (
    name: keyof Pick<RecurringFormType, "isactive" | "autoApplyEnabled" | "isAmountFlexible" | "isDateFlexible">,
    value: boolean,
  ) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };

      // Handle flexible amount/date changes
      if (name === "isAmountFlexible" && value === true) {
        newState.amount = null; // Clear amount if flexible
      }

      if (name === "isDateFlexible" && value === true) {
        newState.nextoccurrencedate = ""; // Clear date if flexible
        newState.frequency = "MONTHLY"; // Reset to default
        newState.interval = 1;
      }

      return newState;
    });
  };

  const handleBlueprintTransactionSelect = async (selected: SearchableDropdownItem) => {
    if (selected && selected.item) {
      // console.log("Selected Transaction ID:", selected.item);
      try {
        setIsSubmitting(true); // Use submitting state for loading indicator
        const blueprintTransaction = selected.item;
        setBlueprintLabel(selected.label);
        // console.log("Blueprint Transaction:", blueprintTransaction);
        let amount = blueprintTransaction.amount;
        if (amount) {
          setMode(amount > 0 ? "plus" : "minus");
        }

        if (blueprintTransaction) {
          setFormData(prev => ({
            ...prev,
            name: blueprintTransaction.name || prev.name,
            description: blueprintTransaction.description || prev.description,
            amount: Math.abs(blueprintTransaction.amount || 0), // Recurrings usually positive
            // Assuming blueprintTransaction.type exists and is compatible with TransactionType
            type: (blueprintTransaction.type as TransactionType) || prev.type,
            currencycode:
              accounts?.find((acc: any) => acc.id === blueprintTransaction.accountid)?.currency || prev.currencycode,
            sourceaccountid: blueprintTransaction.accountid || prev.sourceaccountid,
            categoryid: blueprintTransaction.categoryid || prev.categoryid,
            payeename: blueprintTransaction.payee || prev.payeename,
            // notes: blueprintTransaction.notes || prev.notes, // Decide if notes should be copied
          }));
        }
      } catch (error) {
        console.error("Error fetching blueprint transaction:", error);
        // Optionally show user feedback
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    const recurrenceRule = formData.isDateFlexible ? null : `FREQ=${formData.frequency};INTERVAL=${formData.interval}`;

    const amount = mode === "plus" ? formData.amount : -(formData.amount ?? 0);

    const dataToSubmitApi: Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings> = {
      id: recurringToEdit?.id,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      nextoccurrencedate: formData.isDateFlexible
        ? "2099-12-31"
        : formData.nextoccurrencedate || dayjs().format("YYYY-MM-DD"),
      recurrencerule: recurrenceRule!,
      enddate: formData.enddate,
      amount: formData.isAmountFlexible ? null : amount,
      currencycode: formData.currencycode,
      sourceaccountid: formData.sourceaccountid,
      categoryid: formData.categoryid,
      payeename: formData.payeename,
      notes: formData.notes,
      isactive: formData.isactive,
      recurringtype: formData.recurringType,
      autoapplyenabled: formData.autoApplyEnabled,
      isamountflexible: formData.isAmountFlexible,
      isdateflexible: formData.isDateFlexible,
      transferaccountid: formData.transferaccountid,
    };
    upsertRecurring(
      {
        form: dataToSubmitApi,
        original: recurringToEdit || undefined,
      },
      {
        onSuccess: () => {
          //TODO: Close Modal
          // router.back();
          router.replace("/(drawer)/(tabs)/Recurrings");
        },
        onSettled: () => setIsSubmitting(false),
      },
    );
  };

  const handleCancel = () => {
    router.back();
  };
  const handleModeToggle = useCallback(() => {
    const newMode = mode === "plus" ? "minus" : "plus";
    setMode(newMode);
  }, [mode]);

  return {
    formData,
    setFormData,
    isEdit,
    isLoading,
    isSubmitting,
    categories,
    accounts,
    blueprintLabel,
    handleTextChange,
    handleDateChange,
    handleSwitchChange,
    handleBlueprintTransactionSelect,
    handleSubmit,
    handleCancel,
    mode,
    setMode,
    handleModeToggle,
  };
};
