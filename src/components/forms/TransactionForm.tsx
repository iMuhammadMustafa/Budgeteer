import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { Account, Inserts, Transaction, Updates } from "@/src/types/db/Tables.Types";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import { useGetTransactionCategories } from "@/src/services//TransactionCategories.Service";
import { useGetAccounts } from "@/src/services//Accounts.Service";
import {
  useGetTransactionById,
  useSearchTransactionsByName,
  useUpsertTransaction,
} from "@/src/services//Transactions.Service";
import SearchableDropdown from "../SearchableDropdown";
import MyIcon from "@/src/utils/Icons.Helper";
import MyDateTimePicker from "../MyDateTimePicker";
import TextInputField from "../TextInputField";
import CalculatorComponent from "../Calculator";
import DropdownField, {
  AccountSelecterDropdown,
  MyCategoriesDropdown,
  MyTransactionTypesDropdown,
} from "../DropDownField";
import { getTransactionsByName } from "@/src/repositories";
import { queryClient } from "@/src/providers/QueryProvider";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.types";

dayjs.extend(utc);
dayjs.extend(timezone);

type TransactionUpsertType = Inserts<TableNames.Transactions> | Updates<TableNames.Transactions>;

export type TransactionFormType = TransactionUpsertType & {
  amount: number;
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

  transferid: "",
  transferaccountid: null,
};

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const {
    formData,
    setFormData,
    isEdit,
    isLoading,
    isCategoriesLoading,
    isAccountLoading,
    mode,
    setMode,
    categories,
    accounts,
    sourceAccount,
    destinationAccount,
    handleTextChange,
    handleOnMoreSubmit,
    handleSubmit,
    onSelectItem,
    handleSwitchAccounts,
  } = useTransactionForm({ transaction });
  // console.log(transaction);

  // const [searchText, setSearchText] = useState<string>("");
  // const { data: searchResults, isLoading: isSearchLoading } = useSearchTransactionsByName(searchText);

  const handleReset = () => {
    transaction = initialTransactionState;
    setFormData(initialTransactionState);
    router.replace("/AddTransaction");
  };

  if (isLoading || isCategoriesLoading || isAccountLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="w-full h-full">
      <Pressable
        className="self-end px-5 flex-row items-center"
        disabled={isLoading}
        onPress={() => {
          handleOnMoreSubmit();
        }}
      >
        <MyIcon name="Plus" size={24} className="text-primary-300" />
      </Pressable>
      <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
        <SearchableDropdown
          label="Name"
          searchAction={getTransactionsByName}
          // searchSetter={setSearchText}
          // result={searchResults}
          initalValue={transaction.name}
          onSelectItem={onSelectItem}
          onChange={val => handleTextChange("name", val)}
        />
        {formData.type !== "Transfer" && (
          <TextInputField
            label="Payee"
            value={formData.payee}
            onChange={text => {
              handleTextChange("payee", text);
            }}
          />
        )}
        <MyDateTimePicker
          label="Date"
          date={dayjs(formData.date)} // MyDateTimePicker expects Dayjs | null | undefined
          onChange={isoDateString => {
            // onChange now provides string | null
            if (isoDateString) {
              const formatedDate = dayjs(isoDateString).local().format("YYYY-MM-DDTHH:mm:ss");
              handleTextChange("date", formatedDate);
            } else {
              // Handle case where date is cleared, if applicable for transactions
              // For now, we assume a date is always required for a transaction.
              // If it can be nullable, set formData.date to null or an appropriate default.
              // For example: handleTextChange("date", null);
            }
          }}
        />

        <View className="flex-row justify-center items-center">
          <Pressable
            className={`${formData.type === "Transfer" ? "bg-info-400" : mode === "plus" ? "bg-success-400" : "bg-danger-400"} border border-muted rounded-lg me-2 p-1.5 mt-4`}
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
              <MyIcon name="Minus" size={24} className="text-gray-100" />
            ) : (
              <MyIcon name="Plus" size={24} className="text-gray-100" />
            )}
          </Pressable>
          <TextInputField
            label="Amount"
            value={(formData.amount ?? 0).toString()}
            keyboardType="numeric"
            onChange={text => {
              let numericAmount = text
                .replace(/[^0-9.-]/g, "") // Allow digits, minus sign, and decimal point
                .replace(/(?!^)-/g, "") // Remove any minus sign that isn't at the start
                .replace(/(\d+)\.\.(\d+)/g, "$1.$2") // Keep only the first decimal point
                .replace(/^0+(?=\d)/, ""); // Remove leading zeros

              handleTextChange("amount", numericAmount);
            }}
            className="flex-1"
          />
          <CalculatorComponent
            onSubmit={(result: string) => handleTextChange("amount", Math.abs(parseFloat(result)).toString())}
            currentValue={formData.amount}
          />
        </View>
        <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} z-30`}>
          <MyCategoriesDropdown
            selectedValue={formData.categoryid}
            categories={categories}
            onSelect={value => {
              if (value) {
                // Handle possible null
                handleTextChange("categoryid", value.id);
              }
            }}
            isModal={Platform.OS !== "web"}
          />
          <MyTransactionTypesDropdown
            selectedValue={formData.type}
            onSelect={value => {
              handleTextChange("type", value.value);

              if (value.value === "Transfer") {
                handleTextChange("name", value.value);
                handleTextChange(
                  "categoryid",
                  categories?.find(category => category.name?.startsWith("Account"))?.id ?? "",
                );
                setMode("minus");
              }
            }}
            isModal={Platform.OS !== "web"}
            isEdit={isEdit}
          />
        </View>
        {/* <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}> */}
        {/** TODO: Handle IS VOID */}
        {/* </View> */}

        <View className={`${Platform.OS === "web" ? "flex flex-row items-center" : ""} z-20`}>
          <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
            <AccountSelecterDropdown
              label="Account"
              selectedValue={formData.accountid}
              onSelect={(value: any) => {
                handleTextChange("accountid", value.id);
              }}
              isModal
              accounts={accounts}
              groupBy="group"
            />
          </View>
          {formData.type === "Transfer" && (
            <>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  handleSwitchAccounts();
                }}
                className={`p-2 ${Platform.OS === "web" ? "mx-2" : "my-2 self-center"}`}
              >
                <MyIcon name="ArrowUpDown" size={24} className="text-primary-300" />
              </Pressable>
              <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                <AccountSelecterDropdown
                  label="Destinaton"
                  selectedValue={formData.transferaccountid}
                  onSelect={(value: any) => {
                    handleTextChange("transferaccountid", value.id);
                  }}
                  isModal={Platform.OS !== "web"}
                  accounts={accounts}
                  groupBy="group"
                />
              </View>
            </>
          )}
        </View>
        <View className={` ${Platform.OS === "web" ? "flex flex-row gap-5" : ""} relative z-10`}>
          <TextInputField
            label="Tags"
            value={formData.tags?.toString()}
            onChange={text => {
              handleTextChange("tags", text.split(","));
            }}
            className="flex-1 z-8"
          />
          <TextInputField
            label="Notes"
            value={formData.notes}
            onChange={text => {
              handleTextChange("notes", text);
            }}
            className="flex-1 z-8"
          />
        </View>

        <View className="flex-row text-center justify-center items-center gap-5 mt-2">
          <Pressable className="bg-danger-400 px-5 py-2 align-center justify-center rounded-md" onPress={handleReset}>
            <Text className="text-foreground font-medium text-md" selectable={false}>
              Reset
            </Text>
          </Pressable>
          <Pressable
            className="bg-primary px-5 py-2 align-center justify-center rounded-md"
            disabled={isLoading}
            onPress={handleSubmit}
          >
            <Text className={`text-foreground font-medium text-md ${isLoading ? "text-muted" : ""}`} selectable={false}>
              Save
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useTransactionForm = ({ transaction }: any) => {
  const [formData, setFormData] = useState<TransactionFormType>({
    ...transaction,
    amount: Math.abs(transaction.amount ?? 0),
  });
  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"plus" | "minus">("plus");

  const { data: categories, isLoading: isCategoriesLoading } = useGetTransactionCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();

  const { mutate } = useUpsertTransaction();

  const isEdit = !!transaction.id;

  const getAccountById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return accounts?.find(account => account.id === id) ?? null;
    },
    [accounts],
  );

  useEffect(() => {
    if (!transaction.id) return;

    setFormData({
      ...transaction,
      amount: Math.abs(transaction.amount ?? 0),
    });
    setSourceAccount(getAccountById(transaction.accountid));
    setDestinationAccount(getAccountById(transaction.transferaccountid));
  }, [transaction, accounts]);

  useEffect(() => {
    if (!transaction.amount || transaction.amount == 0) {
      setMode("minus");
    } else {
      setMode(transaction.amount && transaction.amount < 0 ? "minus" : "plus");
    }

    setFormData({
      ...transaction,
      amount: Math.abs(transaction.amount ?? 0),
    });
    setSourceAccount(getAccountById(transaction.accountid));
    setDestinationAccount(getAccountById(transaction.transferaccountid));
  }, [transaction, accounts]);

  const handleTextChange = (name: keyof TransactionFormType, text: string) => {
    if (name === "amount" && text.startsWith("-")) {
      setMode("minus");
      text = text.replace("-", "");
    }

    setFormData((prevFormData: any) => ({ ...prevFormData, [name]: text }));

    if ((name === "type" && text === "Expense") || (name === "type" && text === "Transfer")) {
      setMode("minus");
    }
    if (name === "type" && text === "Income") {
      setMode("plus");
    }
  };

  const handleOnMoreSubmit = () => {
    const updatedDate = dayjs(formData.date).local().add(1, "second").format("YYYY-MM-DDTHH:mm:ss");

    const newItem: TransactionFormType = {
      ...initialTransactionState,
      id: undefined,
      date: updatedDate,
      type: formData.type,
      categoryid: formData.categoryid,
      accountid: formData.accountid,
      createdat: dayjs().local().format("YYYY-MM-DDTHH:mm:ssZ"),
      transferid: undefined,
    };
    handleMutate(newItem);
  };
  const handleSubmit = () => {
    handleMutate();
  };

  const handleMutate = (newItem: TransactionFormType | null = null) => {
    setIsLoading(true);

    let amount = mode === "minus" ? -Math.abs(formData.amount) : Math.abs(formData.amount);

    mutate(
      {
        formData: {
          ...formData,
          amount: amount,
        },
        originalData: transaction as Transaction,
      },
      {
        onSuccess: async () => {
          console.log({
            message: `Transaction ${transaction.id ? "Updated" : "Created"} Successfully`,
            type: "success",
          });
          setIsLoading(false);
          if (newItem) {
            setFormData({ ...newItem });
          } else {
            await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView], exact: false });
            setFormData(initialTransactionState);
            router.replace("/Transactions");
          }
        },
        onError: error => {
          console.log({
            message: error.message,
            type: "error",
          });
          setIsLoading(false);
        },
      },
    );
  };

  const onSelectItem = (item: SearchableDropdownItem) => {
    setFormData({
      ...transaction,
      ...item.item,
      amount: Math.abs(item.item.amount),
    });
    setMode(item.item.amount < 0 ? "minus" : "plus");
    setSourceAccount(getAccountById(item.item.accountid));
    setDestinationAccount(getAccountById(item.item.transferaccountid));
  };

  const handleSwitchAccounts = () => {
    setFormData(prevFormData => {
      const newAccountId = prevFormData.transferaccountid ?? undefined; // Ensure undefined if null
      const newTransferAccountId = prevFormData.accountid ?? null; // Keep null if undefined, or pass string

      return {
        ...prevFormData,
        accountid: newAccountId,
        transferaccountid: newTransferAccountId,
      };
    });
  };

  return {
    formData,
    setFormData,
    isEdit,
    isLoading,
    isCategoriesLoading,
    isAccountLoading,
    mode,
    setMode,
    categories,
    accounts,
    sourceAccount,
    destinationAccount,
    handleTextChange,
    handleOnMoreSubmit,
    handleSubmit,
    onSelectItem,
    handleSwitchAccounts,
  };
};
