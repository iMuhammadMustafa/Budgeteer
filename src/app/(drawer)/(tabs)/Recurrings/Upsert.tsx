import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, Text, Pressable, View, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { Account, Inserts, Recurring, Transaction, TransactionCategory, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useGetTransactionCategories } from "@/src/services/repositories/TransactionCategories.Service";
import { useGetAccounts } from "@/src/services/repositories/Accounts.Service";
import {
  useGetRecurring,
  useCreateRecurring,
  useUpdateRecurring,
} from "@/src/services/repositories/Recurrings.Service";
import { RepositoryManager } from "@/src/services/apis/repositories/RepositoryManager";
import SearchableDropdown from "@/src/components/SearchableDropdown";
import MyIcon from "@/src/utils/Icons.Helper";
import MyDateTimePicker from "@/src/components/MyDateTimePicker";
import TextInputField from "@/src/components/TextInputField";
import DropdownField, { AccountSelecterDropdown, MyCategoriesDropdown } from "@/src/components/DropDownField"; // Added DropdownField
import { queryClient } from "@/src/providers/QueryProvider";
import { SearchableDropdownItem, OptionItem } from "@/src/types/components/DropdownField.types"; // Added OptionItem
// import { Inserts<TableNames.Recurrings>, Updates<TableNames.Recurrings> } from "@/src/services/apis/Recurrings.repository";
import { useAuth } from "@/src/providers/AuthProvider";

// Get repository manager instance
const repositoryManager = RepositoryManager.getInstance();

dayjs.extend(utc);
dayjs.extend(timezone);

// Define RecurringType, assuming these are the valid types
export type RecurringTransactionType = "Expense" | "Income" | "Transfer";

type RecurringFormType = Omit<Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings>, "recurrencerule"> & {
  frequency: RecurrenceFrequency;
  interval: number;
  type: RecurringTransactionType; // Added type field
  destinationaccountid: string | null;
  recurrencerule?: string; // Will be constructed
};

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
  destinationaccountid: null,
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
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;

  // Create a function to search transactions by name using the repository
  const searchTransactionsByName = useCallback(
    async (text: string): Promise<SearchableDropdownItem[]> => {
      if (!tenantId) return [];
      const transactionRepository = repositoryManager.getTransactionRepository();
      return transactionRepository.getTransactionsByName(text, tenantId);
    },
    [tenantId],
  );

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

  if (isLoading) return <ActivityIndicator className="flex-1 justify-center items-center" />;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
        <Text className="text-2xl font-bold text-foreground mb-5">
          {isEdit ? "Edit Recurring" : "Create Recurring"}
        </Text>

        {!isEdit && (
          <SearchableDropdown
            label="Blueprint Transaction (Optional)"
            placeholder="Search transaction by name..."
            searchAction={searchTransactionsByName}
            onSelectItem={handleBlueprintTransactionSelect}
            onChange={() => {}} // Required, but selection handles logic
          />
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
        <DropdownField
          label="Type"
          options={recurringTypeOptions}
          selectedValue={formData.type}
          onSelect={(item: OptionItem | null) => {
            if (item) {
              handleTextChange("type", item.id as RecurringTransactionType);
            }
          }}
          isModal={Platform.OS !== "web"}
        />
        <MyDateTimePicker
          label="Next Occurrence Date"
          date={dayjs(formData.nextoccurrencedate)}
          onChange={isoDateString => handleDateChange("nextoccurrencedate", isoDateString?.toISOString())}
        />
        {/* Recurrence Rule Inputs */}
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
        <TextInputField
          label="Interval"
          value={formData.interval.toString()}
          onChange={text => handleTextChange("interval", parseInt(text, 10) || 1)}
          keyboardType="numeric"
          placeholder="e.g., 1"
        />
        <MyDateTimePicker
          label="End Date (Optional)"
          date={formData.enddate ? dayjs(formData.enddate) : null}
          onChange={isoDateString => handleDateChange("enddate", isoDateString?.toISOString())}
          showClearButton={!!formData.enddate}
          onClear={() => handleDateChange("enddate", null)}
        />
        <TextInputField
          label="Amount"
          value={(formData.amount ?? 0).toString()} // Default to 0 if undefined
          onChange={text => handleTextChange("amount", parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="e.g., 1200.50"
        />
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
          onSelect={account => {
            if (account) {
              // Check if account is not null
              handleTextChange("sourceaccountid", account.id);
            }
          }}
          accounts={accounts}
          isModal={Platform.OS !== "web"}
          groupBy="category.name"
        />
        {formData.type === "Transfer" && (
          <AccountSelecterDropdown
            label="Destination Account"
            selectedValue={formData.destinationaccountid}
            onSelect={account => {
              if (account) {
                handleTextChange("destinationaccountid", account.id);
              }
            }}
            accounts={accounts}
            isModal={Platform.OS !== "web"}
            groupBy="category.name"
          />
        )}
        {formData.type !== "Transfer" && (
          <MyCategoriesDropdown
            label="Category (Optional)"
            selectedValue={formData.categoryid}
            categories={categories}
            onSelect={category => handleTextChange("categoryid", category?.id || null)}
            isModal={Platform.OS !== "web"}
            showClearButton={!!formData.categoryid}
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

  const { data: recurringToEdit, isLoading: isLoadingRecurring } = useGetRecurring(recurringIdToEdit);
  const [formData, setFormData] = useState<RecurringFormType>(initialRecurringState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: isLoadingCategories } = useGetTransactionCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();

  const { mutate: createRecurring } = useCreateRecurring();
  const { mutate: updateRecurring } = useUpdateRecurring();

  const isEdit = !!recurringIdToEdit;
  const isLoading = isLoadingRecurring || isLoadingCategories || isLoadingAccounts;

  useEffect(() => {
    if (isEdit && recurringToEdit) {
      // Parse recurrencerule
      let freq: RecurrenceFrequency = "MONTHLY";
      let interv = 1;
      if (recurringToEdit.recurrencerule) {
        const parts = recurringToEdit.recurrencerule.split(";");
        const freqPart = parts.find(p => p.startsWith("FREQ="));
        const intervalPart = parts.find(p => p.startsWith("INTERVAL="));
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
        nextoccurrencedate: dayjs(recurringToEdit.nextoccurrencedate).format("YYYY-MM-DD"),
        enddate: recurringToEdit.enddate ? dayjs(recurringToEdit.enddate).format("YYYY-MM-DD") : null,
      });
    } else if (!isEdit) {
      setFormData({ ...initialRecurringState, tenantid: tenantId || "" }); // Ensure tenantId is set if available
    }
  }, [recurringToEdit, isEdit]);

  const handleTextChange = (
    name: keyof RecurringFormType,
    value: string | number | boolean | null | string[] | RecurrenceFrequency | RecurringTransactionType,
  ) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === "type") {
        if (value === "Transfer") {
          newState.categoryid = null; // Transfers don't have categories
        } else {
          newState.destinationaccountid = null; // Other types don't have a destination account
        }
      }
      return newState;
    });
  };

  const handleDateChange = (
    name: keyof Pick<RecurringFormType, "nextoccurrencedate" | "enddate">,
    isoDateString: string | null | undefined,
  ) => {
    setFormData(prev => ({ ...prev, [name]: isoDateString ? dayjs(isoDateString).format("YYYY-MM-DD") : null }));
  };

  const handleSwitchChange = (name: keyof Pick<RecurringFormType, "isactive">, value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
              accounts?.find(acc => acc.id === blueprintTransaction.accountid)?.currency || prev.currencycode,
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

    // Construct recurrencerule from frequency and interval
    const recurrenceRule = `FREQ=${formData.frequency};INTERVAL=${formData.interval}`;

    // Prepare data for submission, ensuring correct types and removing form-specific fields
    const { frequency, interval, ...restOfFormData } = formData;
    const dataToSubmitApi: Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings> = {
      ...restOfFormData,
      recurrencerule: recurrenceRule,
    };

    // Clean up undefined properties before sending to API
    Object.keys(dataToSubmitApi).forEach(key => {
      if (dataToSubmitApi[key as keyof typeof dataToSubmitApi] === undefined) {
        delete dataToSubmitApi[key as keyof typeof dataToSubmitApi];
      }
    });

    if (isEdit && recurringIdToEdit) {
      updateRecurring(
        { id: recurringIdToEdit, recurringData: dataToSubmitApi as Updates<TableNames.Recurrings> },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
            queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, recurringIdToEdit, tenantId] });
            router.back();
          },
          onError: e => console.error("Error updating recurring:", e),
          onSettled: () => setIsSubmitting(false),
        },
      );
    } else {
      createRecurring(dataToSubmitApi as Inserts<TableNames.Recurrings>, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
          router.back();
        },
        onError: e => console.error("Error creating recurring:", e),
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
