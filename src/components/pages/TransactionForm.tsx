import { useEffect, useState } from "react";
import { TransactionsView } from "../../lib/supabase";
import { useUpsertTransaction } from "../../repositories/transactions.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetCategories } from "../../repositories/categories.service";
import { useGetAccounts } from "../../repositories/account.service";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { Box } from "@/components/ui/box";
import VCalc from "../VCalc";
import SearchableDropdown, { SearchableDropdownItem } from "../SearchableDropdown";
import { getTransactionsByDescription } from "../../repositories/transactions.api";
import Modal from "react-native-modal";
import Icon from "@/src/lib/IonIcons";
import * as Haptics from "expo-haptics";
import MyDropDown, { MyCategoriesDropdown } from "../MyDropdown";
import MyDateTimePicker from "../MyDateTimePicker";

export type TransactionFormType = TransactionsView & { amount: number };

export const initialTransactionState: TransactionFormType = {
  description: "",
  date: dayjs().toISOString(),
  amount: 0,
  type: "Expense",

  accountid: "",
  categoryid: "",
  notes: "",
  tags: null,
  status: "None",

  transferid: "",
  transferaccountid: "",

  createdat: null,

  accountname: null,
  balance: null,
  categorygroup: null,
  categoryname: null,
  categorytype: null,
  createdby: null,
  currency: null,
  icon: null,
  id: null,
  isdeleted: null,
  running_balance: null,
  tenantid: null,
  updatedat: null,
  updatedby: null,
};

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const [formData, setFormData] = useState<TransactionFormType>({
    ...transaction,
    amount: Math.abs(transaction.amount ?? 0),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [sourceAccount, setSourceAccount] = useState(null);
  const [destinationAccount, setDestinationAccount] = useState(null);
  const router = useRouter();
  const [mode, setMode] = useState<"plus" | "minus">("plus");

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

  useEffect(() => {
    setFormData(transaction);
    setSourceAccount(accounts?.find(account => account.id === transaction.accountid));
    setDestinationAccount(accounts?.find(account => account.id === transaction.transferaccountid));

    if (!transaction.amount || transaction.amount == 0) {
      setMode("minus");
    } else {
      setMode(transaction.amount && transaction.amount < 0 ? "minus" : "plus");
    }
  }, [transaction, accounts]);

  const handleTextChange = (name: keyof TransactionFormType, text: any) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));

    if ((name === "type" && text === "Expense") || (name === "type" && text === "Transfer")) {
      setMode("minus");
    }
    if (name === "type" && text === "Income") {
      setMode("plus");
    }
  };

  const handleOnMoreSubmit = () => {
    const newItem = {
      ...initialTransactionState,
      date: dayjs(formData.date).toString(),
      type: formData.type,
      categoryid: formData.categoryid,
      accountid: formData.accountid,
    };
    handleMutate(true);
    setFormData(newItem);
  };
  const handleSubmit = () => {
    handleMutate();
  };

  const handleMutate = (isOneMore = false) => {
    setIsLoading(true);

    let amount = mode === "minus" ? -Math.abs(formData.amount) : Math.abs(formData.amount);

    mutate(
      {
        fullFormTransaction: {
          ...formData,
          amount: amount,
        },
        originalData: transaction,
        sourceAccount,
        destinationAccount,
      },
      {
        onSuccess: () => {
          addNotification({
            message: `Transaction ${transaction.id ? "Updated" : "Created"} Successfully`,
            type: "success",
          });
          setIsLoading(false);
          if (!isOneMore) {
            router.replace("/Transactions");
          }
        },
      },
    );
  };

  const onSelectItem = (item: SearchableDropdownItem) => {
    setFormData({
      ...transaction,
      ...item.item,
    });
    setMode(item.item.amount < 0 ? "minus" : "plus");
    setSourceAccount(accounts?.find(account => account.id === item.item.accountid));
    setDestinationAccount(accounts?.find(account => account.id === item.item.transferaccountid));
  };

  if (isLoading || isCategoriesLoading || isAccountLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="flex-1">
      <TouchableOpacity
        className="self-end px-5 flex-row items-center"
        disabled={isLoading}
        onPress={() => {
          handleOnMoreSubmit();
        }}
      >
        <Icon name="Plus" size={24} className="text-primary-300" />
      </TouchableOpacity>
      <ScrollView className="p-5 px-6" nestedScrollEnabled={true}>
        <SearchableDropdown
          label="Description"
          searchAction={val => getTransactionsByDescription(val)}
          initalValue={transaction.description}
          onSelectItem={onSelectItem}
          onChange={val => handleTextChange("description", val)}
        />

        <MyDateTimePicker
          label="Date"
          date={formData.date}
          onChange={params => handleTextChange("date", params.date)}
        />

        <Box className="flex-row justify-center items-center">
          <Pressable
            className={`${mode === "plus" ? "bg-success-400" : "bg-error-400"} border border-muted rounded-lg me-2 p-1.5 mt-4`}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync();
              }
              if (mode === "plus") {
                setMode("minus");
              } else {
                setMode("plus");
              }
            }}
          >
            {mode === "minus" ? (
              <Icon name="Minus" size={24} className="text-gray-100" />
            ) : (
              <Icon name="Plus" size={24} className="text-gray-100" />
            )}
          </Pressable>
          <TextInputField
            label="Amount"
            value={(formData.amount ?? 0).toString()}
            keyboardType="numeric"
            onChange={text => {
              //handle number starting with a minus sign
              let numericAmount = parseFloat(text.replace(/[^0-9.-]/g, ""));
              if (text.length <= 0) {
                numericAmount = 0;
              }

              // setMode(numericAmount < 0 ? "minus" : "plus");

              handleTextChange("amount", Math.abs(numericAmount).toString());
            }}
            className="flex-1"
          />
          <VCalc
            onSubmit={(result: string) => handleTextChange("amount", Math.abs(parseFloat(result)).toString())}
            currentValue={formData.amount?.toString()}
          />
        </Box>

        <MyDropDown
          isModal={Platform.OS !== "web"}
          label="Type"
          options={[
            { id: "Income", label: "Income", value: "Income" },
            { id: "Expense", label: "Expense", value: "Expense" },
            { id: "Transfer", label: "Transfer", value: "Transfer" },
            { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: true },
            { id: "Initial", label: "Initial", value: "Initial", disabled: true },
            { id: "Refund", label: "Refund", value: "Refund", disabled: true },
          ]}
          selectedValue={formData.type}
          onSelect={value => {
            handleTextChange("type", value.value);
          }}
        />

        <MyCategoriesDropdown
          selectedValue={formData.categoryid}
          categories={categories}
          onSelect={value => handleTextChange("categoryid", value.id)}
          isModal={Platform.OS !== "web"}
        />

        <MyDropDown
          isModal={Platform.OS !== "web"}
          label="Account"
          selectedValue={formData.accountid}
          options={
            accounts?.map(account => ({
              id: account.id,
              label: account.name,
              value: account,
              passedItem: account,
            })) ?? []
          }
          onSelect={(value: any) => {
            handleTextChange("accountid", value.id);
            setSourceAccount(value.value);
          }}
        />

        {formData.type === "Transfer" && (
          <MyDropDown
            isModal={Platform.OS !== "web"}
            label="Destinaton Account"
            selectedValue={formData.transferaccountid}
            options={
              accounts?.map(account => ({
                id: account.id,
                label: account.name,
                value: account,
                passedItem: account,
              })) ?? []
            }
            onSelect={(value: any) => {
              handleTextChange("transferaccountid", value.id);
              setDestinationAccount(value.value);
            }}
          />
        )}

        <MyDropDown
          isModal={Platform.OS !== "web"}
          label="Status"
          options={[
            { id: "None", label: "None", value: "None" },
            { id: "Cleared", label: "Cleared", value: "Cleared" },
            { id: "Reconciled", label: "Reconciled", value: "Reconciled" },
            { id: "Void", label: "Void", value: "Void" },
          ]}
          selectedValue={formData.status}
          onSelect={value => handleTextChange("status", value.value)}
        />

        <TextInputField
          label="Tags"
          value={formData.tags?.toString()}
          onChange={text => {
            handleTextChange("tags", text.split(","));
          }}
        />
        <TextInputField
          label="Notes"
          value={formData.notes}
          onChange={text => {
            handleTextChange("notes", text);
          }}
        />

        <Button className="p-3 flex justify-center items-center" disabled={isLoading} onPress={handleSubmit}>
          {isLoading ? <ButtonSpinner /> : <ButtonText className="font-medium text-sm ml-2">Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
