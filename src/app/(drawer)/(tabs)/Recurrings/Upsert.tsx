import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, Text, Pressable, View, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { TableNames } from "@/src/types/db/TableNames";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useRecurringService } from "@/src/services/Recurring.Service";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import MyDateTimePicker from "@/src/components/MyDateTimePicker";
import TextInputField from "@/src/components/TextInputField";
import DropdownField, { AccountSelecterDropdown, MyCategoriesDropdown } from "@/src/components/DropDownField"; // Added DropdownField
import { queryClient } from "@/src/providers/QueryProvider";
import { SearchableDropdownItem, OptionItem } from "@/src/types/components/DropdownField.types"; // Added OptionItem
import { useAuth } from "@/src/providers/AuthProvider";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { IntervalSelector } from "@/src/components/recurring/IntervalDisplay";
import { RecurringTransferForm } from "@/src/components/recurring/RecurringTransferForm";
import { RecurringCreditCardForm } from "@/src/components/recurring/RecurringCreditCardForm";
import { RecurringInsert, RecurringUpdate } from "@/src/types/db/sqllite/schema";
import { RecurringType } from "@/src/types/recurring";

dayjs.extend(utc);
dayjs.extend(timezone);

type RecurringFormType = Omit<RecurringInsert | RecurringUpdate, "recurrencerule"> & {
  frequency: RecurrenceFrequency;
  interval: number;
  intervalMonths: number; // Custom monthly interval (1-24)
  type: RecurringTransactionType; // Added type field
  transferaccountid?: string | null; // For transfer transactions
  recurringType: RecurringType; // Standard, Transfer, CreditCardPayment
  autoApplyEnabled: boolean; // Individual auto-apply setting
  isAmountFlexible: boolean; // Allow transactions without predefined amount
  isDateFlexible: boolean; // Allow transactions without predefined date
  recurrencerule?: string; // Will be constructed
};

export type RecurringTransactionType = "Expense" | "Income" | "Transfer";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

const recurrenceFrequencyOptions: OptionItem[] = [
  // Ensure it's OptionItem[]
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
  { id: RecurringType.CreditCardPayment, label: "Credit Card Payment", value: RecurringType.CreditCardPayment },
];

export const initialRecurringState: RecurringFormType = {
  name: "",
  description: undefined,
  nextoccurrencedate: dayjs().local().format("YYYY-MM-DD"),
  type: "Expense", // Default type
  // recurrencerule: "FREQ=MONTHLY;INTERVAL=1", // Default to monthly - will be constructed
  frequency: "MONTHLY",
  interval: 1,
  intervalMonths: 1, // Default to monthly
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

export default function RecurringUpsertScreen() {
  const { id: recurringIdToEdit } = useLocalSearchParams<{ id?: string }>();
  const {
    formData,
    setFormData,
    isEdit,
    isLoading,
    isSubmitting,
    categories,
    accounts,
    handleTextChange,
    handleDateChange,
    handleSwitchChange,
    handleBlueprintTransactionSelect,
    handleSubmit,
    handleCancel,
  } = useRecurringForm(recurringIdToEdit);
  const transactionService = useTransactionService();

  if (isLoading) return <ActivityIndicator className="flex-1 justify-center items-center" />;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
        <Text className="text-xl  text-foreground mb-5 text-center">
          {isEdit ? "Edit Recurring Transaction" : "Create Recurring Transaction"}
        </Text>

        {!isEdit && (
          <View className="mb-2">
            <SearchableDropdown
              label="Blueprint Transaction (Optional)"
              placeholder="Search transaction by name..."
              searchAction={transactionService.findByName}
              onSelectItem={handleBlueprintTransactionSelect}
              onChange={() => {}}
            />
          </View>
        )}

        <TextInputField
          label="Name"
          value={formData.name}
          onChange={text => handleTextChange("name", text)}
          placeholder="e.g., Rent Payment"
        />
        <TextInputField
          label="Description"
          value={formData.description ?? ""}
          onChange={text => handleTextChange("description", text)}
          placeholder="e.g., Monthly apartment rent"
          multiline
        />
        <View className="z-50">
          <DropdownField
            label="Recurring Category"
            options={recurringCategoryOptions}
            selectedValue={formData.recurringType}
            onSelect={(item: OptionItem | null) => {
              if (item) {
                handleTextChange("recurringType", item.id as RecurringType);
              }
            }}
            isModal={Platform.OS !== "web"}
          />
        </View>

        <View className=" z-40">
          <DropdownField
            label="Transaction Type"
            options={recurringTypeOptions}
            selectedValue={formData.type}
            onSelect={(item: OptionItem | null) => {
              if (item) {
                handleTextChange("type", item.id as RecurringTransactionType);
              }
            }}
            isModal={Platform.OS !== "web"}
          />
        </View>
        <View className="flex-row justify-between items-center my-3 p-3 border border-gray-300 rounded-md">
          <Text className="text-foreground">Flexible Date (Manual Scheduling)</Text>
          <Switch
            value={!!formData.isDateFlexible}
            onValueChange={value => handleSwitchChange("isDateFlexible", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={!!formData.isDateFlexible ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        {!formData.isDateFlexible && (
          <MyDateTimePicker
            label="Next Occurrence Date"
            date={dayjs(formData.nextoccurrencedate)}
            onChange={isoDateString => handleDateChange("nextoccurrencedate", isoDateString)}
          />
        )}
        {/* Recurrence Rule Inputs */}
        {!formData.isDateFlexible && (
          <>
            <View className="z-30">
              <DropdownField
                label="Frequency"
                options={recurrenceFrequencyOptions}
                selectedValue={formData.frequency}
                onSelect={(item: OptionItem | null) => {
                  // Handle null item
                  if (item) {
                    handleTextChange("frequency", item.id as RecurrenceFrequency);
                  }
                }}
                isModal={Platform.OS !== "web"}
              />
            </View>
            <TextInputField
              label="Interval"
              value={formData.interval.toString()}
              onChange={text => handleTextChange("interval", parseInt(text, 10) || 1)}
              keyboardType="numeric"
              placeholder="e.g., 1"
            />

            {formData.frequency === "MONTHLY" && (
              <View className="my-3">
                <Text className="text-foreground font-medium mb-2">Custom Monthly Interval</Text>
                <IntervalSelector
                  value={formData.intervalMonths}
                  onChange={intervalMonths => handleTextChange("intervalMonths", intervalMonths)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </View>
            )}
          </>
        )}
        <MyDateTimePicker
          label="End Date (Optional)"
          date={formData.enddate ? dayjs(formData.enddate) : null}
          onChange={isoDateString => handleDateChange("enddate", isoDateString)}
          showClearButton={!!formData.enddate}
          onClear={() => handleDateChange("enddate", null)}
        />
        <View className="flex-row justify-between items-center my-3 p-3 border border-gray-300 rounded-md">
          <Text className="text-foreground">Flexible Amount (Enter at Execution)</Text>
          <Switch
            value={!!formData.isAmountFlexible}
            onValueChange={value => handleSwitchChange("isAmountFlexible", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={!!formData.isAmountFlexible ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        {formData.isDateFlexible && formData.isAmountFlexible && (
          <View className="bg-blue-50 p-4 rounded-md border border-blue-200 my-3">
            <Text className="text-blue-800 font-medium mb-2">Fully Flexible Transaction</Text>
            <Text className="text-blue-600 text-sm">
              This recurring transaction is fully flexible - you can execute it at any time with any amount. Perfect for
              irregular expenses or income that vary in timing and amount.
            </Text>
          </View>
        )}

        {!formData.isAmountFlexible && formData.recurringType !== RecurringType.CreditCardPayment && (
          <TextInputField
            label="Amount"
            value={(formData.amount ?? 0).toString()} // Default to 0 if undefined
            onChange={text => handleTextChange("amount", parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="e.g., 1200.50"
          />
        )}
        {/* Conditional rendering based on recurring type */}
        {formData.recurringType === RecurringType.Transfer ? (
          <RecurringTransferForm
            sourceAccountId={formData.sourceaccountid || ""}
            destinationAccountId={formData.transferaccountid || ""}
            amount={formData.amount ?? null}
            currencyCode={formData.currencycode || "USD"}
            accounts={accounts}
            isAmountFlexible={formData.isAmountFlexible}
            onSourceAccountChange={accountId => handleTextChange("sourceaccountid", accountId)}
            onDestinationAccountChange={accountId => {
              handleTextChange("transferaccountid", accountId);
            }}
            onAmountChange={amount => handleTextChange("amount", Math.abs(amount))}
            onCurrencyCodeChange={currencyCode => handleTextChange("currencycode", currencyCode.toUpperCase())}
          />
        ) : formData.recurringType === RecurringType.CreditCardPayment ? (
          <RecurringCreditCardForm
            sourceAccountId={formData.sourceaccountid || ""}
            creditCardAccountId={formData.transferaccountid || null}
            categoryId={formData.categoryid || null}
            currencyCode={formData.currencycode || "USD"}
            accounts={accounts}
            categories={categories}
            onSourceAccountChange={accountId => handleTextChange("sourceaccountid", accountId)}
            onCreditCardAccountChange={accountId => handleTextChange("transferaccountid", accountId)}
            onCategoryChange={categoryId => handleTextChange("categoryid", categoryId)}
            onCurrencyCodeChange={currencyCode => handleTextChange("currencycode", currencyCode.toUpperCase())}
          />
        ) : (
          // Standard recurring transaction form
          <>
            <TextInputField
              label="Currency Code"
              value={formData.currencycode}
              onChange={text => handleTextChange("currencycode", text.toUpperCase())}
              placeholder="e.g., USD"
              maxLength={3}
            />
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
          </>
        )}
        {formData.type !== "Transfer" && formData.recurringType !== RecurringType.Transfer && (
          <MyCategoriesDropdown
            label="Category"
            selectedValue={formData.categoryid}
            categories={categories}
            onSelect={category => handleTextChange("categoryid", category?.id || null)}
            isModal={Platform.OS !== "web"}
            showClearButton={!!formData.categoryid && formData.recurringType !== RecurringType.CreditCardPayment}
            onClear={() => handleTextChange("categoryid", null)}
          />
        )}
        <TextInputField
          label="Payee Name (Optional)"
          value={formData.payeename ?? ""}
          onChange={text => handleTextChange("payeename", text)}
          placeholder="e.g., Landlord Name"
        />
        <TextInputField
          label="Notes (Optional)"
          value={formData.notes ?? ""}
          onChange={text => handleTextChange("notes", text)}
          placeholder="Any additional notes"
          multiline
        />
        <View className="flex-row justify-between items-center my-3 p-3 border border-gray-300 rounded-md">
          <Text className="text-foreground">Auto-Apply on Startup</Text>
          <Switch
            value={!!formData.autoApplyEnabled}
            onValueChange={value => handleSwitchChange("autoApplyEnabled", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={!!formData.autoApplyEnabled ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        <View className="flex-row justify-between items-center my-3 p-3 border border-gray-300 rounded-md">
          <Text className="text-foreground">Is Active</Text>
          <Switch
            value={!!formData.isactive} // Ensure boolean value
            onValueChange={value => handleSwitchChange("isactive", value)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={!!formData.isactive ? "#f5dd4b" : "#f4f3f4"} // Ensure boolean value
          />
        </View>

        <View className="flex-row text-center justify-around items-center gap-5 mt-5 mb-10">
          <Pressable className="bg-gray-500 px-8 py-3 rounded-md" onPress={handleCancel} disabled={isSubmitting}>
            <Text className="text-white font-medium text-lg" selectable={false}>
              Cancel
            </Text>
          </Pressable>
          <Pressable className="bg-primary px-8 py-3 rounded-md" disabled={isSubmitting} onPress={handleSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-medium text-lg" selectable={false}>
                {isEdit ? "Update" : "Save"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useRecurringForm = (recurringIdToEdit?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;

  const [formData, setFormData] = useState<RecurringFormType>(initialRecurringState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recurringService = useRecurringService();
  const transactionCategoriesService = useTransactionCategoryService();
  const accountsService = useAccountService();
  const { data: recurringToEdit, isLoading: isLoadingRecurring } = recurringService.findById(recurringIdToEdit);
  const { data: categories, isLoading: isLoadingCategories } = transactionCategoriesService.findAll();
  const { data: accounts, isLoading: isLoadingAccounts } = accountsService.findAll();

  const { mutate: createRecurring } = recurringService.create();
  const { mutate: updateRecurring } = recurringService.update();

  const isEdit = !!recurringIdToEdit;
  const isLoading = isLoadingRecurring || isLoadingCategories || isLoadingAccounts;

  useEffect(() => {
    if (isEdit && recurringToEdit) {
      // Parse recurrencerule
      let freq: RecurrenceFrequency = "MONTHLY";
      let interv = 1;
      if (recurringToEdit.recurrencerule) {
        const parts = recurringToEdit.recurrencerule.split(";");
        const freqPart = parts.find((p: string) => p.startsWith("FREQ="));
        const intervalPart = parts.find((p: string) => p.startsWith("INTERVAL="));
        if (freqPart) {
          freq = freqPart.split("=")[1] as RecurrenceFrequency;
        }
        if (intervalPart) {
          interv = parseInt(intervalPart.split("=")[1], 10) || 1;
        }
      }

      setFormData({
        ...(recurringToEdit as any), // Cast to any to allow additional form fields like frequency, interval
        type: (recurringToEdit.type as RecurringTransactionType) || "Expense", // Set type, default if not present
        frequency: freq,
        interval: interv,
        intervalMonths: recurringToEdit.intervalmonths || interv,
        recurringType: recurringToEdit.recurringtype || RecurringType.Standard,
        autoApplyEnabled: recurringToEdit.autoapplyenabled || false,
        isAmountFlexible: recurringToEdit.isamountflexible || false,
        isDateFlexible: recurringToEdit.isdateflexible || false,
        transferaccountid: recurringToEdit.transferaccountid || null,
        nextoccurrencedate: dayjs(recurringToEdit.nextoccurrencedate).format("YYYY-MM-DD"),
        enddate: recurringToEdit.enddate ? dayjs(recurringToEdit.enddate).format("YYYY-MM-DD") : null,
      });
    } else if (!isEdit) {
      setFormData({ ...initialRecurringState, tenantid: tenantId || "" }); // Ensure tenantId is set if available
    }
  }, [recurringToEdit, isEdit]);

  const handleTextChange = (
    name: keyof RecurringFormType,
    value: string | number | boolean | null | string[] | RecurrenceFrequency | RecurringTransactionType | RecurringType,
  ) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };

      // Handle recurring type changes
      if (name === "recurringType") {
        if (value === RecurringType.Transfer) {
          newState.type = "Transfer";
          newState.categoryid = null; // Transfers don't have categories
        } else if (value === RecurringType.CreditCardPayment) {
          newState.type = "Transfer"; // Credit card payments are transfers
          newState.isAmountFlexible = true; // Credit card payments always have flexible amounts
          newState.amount = null; // Clear amount as it will be calculated at execution
          // Keep categoryid as it's required for credit card payments
        } else {
          // Standard recurring transaction
          newState.transferaccountid = null;
        }
      }

      // Handle transaction type changes
      if (name === "type") {
        if (value === "Transfer") {
          newState.categoryid = null; // Transfers don't have categories
        } else {
          newState.transferaccountid = null; // Other types don't have a destination account
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
        newState.intervalMonths = 1;
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
        newState.intervalMonths = 1;
      }

      return newState;
    });
  };

  const handleBlueprintTransactionSelect = async (selected: SearchableDropdownItem) => {
    if (selected && selected.item) {
      console.log("Selected Transaction ID:", selected.item);
      try {
        setIsSubmitting(true); // Use submitting state for loading indicator
        const blueprintTransaction = selected.item;
        console.log("Blueprint Transaction:", blueprintTransaction);
        if (blueprintTransaction) {
          setFormData(prev => ({
            ...prev,
            name: blueprintTransaction.name || prev.name,
            description: blueprintTransaction.description || prev.description,
            amount: Math.abs(blueprintTransaction.amount || 0), // Recurrings usually positive
            // Assuming blueprintTransaction.type exists and is compatible with RecurringTransactionType
            type: (blueprintTransaction.type as RecurringTransactionType) || prev.type,
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
    if (!tenantId || !userId) {
      console.error("User or Tenant ID not found for submission.");
      // Optionally show user feedback
      return;
    }
    setIsSubmitting(true);

    // Construct recurrencerule from frequency and interval (only if not date flexible)
    const recurrenceRule = formData.isDateFlexible
      ? ""
      : `FREQ=${formData.frequency};INTERVAL=${formData.intervalMonths || formData.interval}`;

    // Prepare data for submission, ensuring correct types and removing form-specific fields
    const dataToSubmitApi: RecurringInsert | RecurringUpdate = {
      // Core fields
      name: formData.name,
      description: formData.description,
      type: formData.type,
      nextoccurrencedate: formData.isDateFlexible
        ? "2099-12-31"
        : formData.nextoccurrencedate || dayjs().format("YYYY-MM-DD"),
      recurrencerule: recurrenceRule,
      enddate: formData.enddate,
      amount: formData.isAmountFlexible ? null : formData.amount,
      currencycode: formData.currencycode,
      sourceaccountid: formData.sourceaccountid,
      categoryid: formData.categoryid,
      payeename: formData.payeename,
      notes: formData.notes,
      isactive: formData.isactive,
      tenantid: formData.tenantid,

      // Enhanced fields (using correct lowercase names)
      intervalmonths: formData.intervalMonths,
      recurringtype: formData.recurringType,
      autoapplyenabled: formData.autoApplyEnabled,
      isamountflexible: formData.isAmountFlexible,
      isdateflexible: formData.isDateFlexible,
      transferaccountid: formData.transferaccountid,
    };

    // Clean up undefined properties before sending to API
    Object.keys(dataToSubmitApi).forEach(key => {
      if (dataToSubmitApi[key as keyof typeof dataToSubmitApi] === undefined) {
        delete dataToSubmitApi[key as keyof typeof dataToSubmitApi];
      }
    });

    if (isEdit && recurringIdToEdit) {
      updateRecurring(
        { id: recurringIdToEdit, updates: dataToSubmitApi as RecurringUpdate },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
            queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, recurringIdToEdit, tenantId] });
            router.back();
          },
          onError: (e: any) => console.error("Error updating recurring:", e),
          onSettled: () => setIsSubmitting(false),
        },
      );
    } else {
      createRecurring(dataToSubmitApi as RecurringInsert, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
          router.back();
        },
        onError: (e: any) => console.error("Error creating recurring:", e),
        onSettled: () => setIsSubmitting(false),
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return {
    formData,
    setFormData,
    isEdit,
    isLoading,
    isSubmitting,
    categories,
    accounts,
    handleTextChange,
    handleDateChange,
    handleSwitchChange,
    handleBlueprintTransactionSelect,
    handleSubmit,
    handleCancel,
  };
};
