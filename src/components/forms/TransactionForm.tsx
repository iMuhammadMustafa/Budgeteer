import { useEffect, useState } from "react";
import { TransactionFormType, useUpsertTransaction } from "../../repositories/services/transactions.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import { ActivityIndicator, Platform, Pressable, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetCategories } from "../../repositories/services/categories.service";
import { useGetAccounts } from "../../repositories/services/account.service";
import dayjs from "dayjs";
import { Box } from "@/components/ui/box";
import VCalc from "../VCalc";
import SearchableDropdown, { SearchableDropdownItem } from "../SearchableDropdown";
import { getTransactionsByDescription } from "../../repositories/apis/transactions.api";
import Icon from "@/src/lib/IonIcons";
import * as Haptics from "expo-haptics";
import MyDropDown, { MyCategoriesDropdown } from "../MyDropdown";
import MyDateTimePicker from "../MyDateTimePicker";

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
  transferaccountid: null,

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
  const [sourceAccount, setSourceAccount] = useState(null);
  const [destinationAccount, setDestinationAccount] = useState(null);
  const router = useRouter();
  const [mode, setMode] = useState<"plus" | "minus">("plus");

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

  const isEdit = !!transaction.id;

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
    setSourceAccount(accounts?.find(account => account.id === transaction.accountid));
    setDestinationAccount(accounts?.find(account => account.id === transaction.transferaccountid));
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
    const updatedDate = dayjs(formData.date)
      .add(1, "second") // Add 1 second
      .toISOString(); // Convert to ISO string

    const newItem: TransactionFormType = {
      ...initialTransactionState,
      id: undefined,
      date: updatedDate,
      type: formData.type,
      categoryid: formData.categoryid,
      accountid: formData.accountid,
      createdat: dayjs().toISOString(),
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
          if (newItem) {
            setFormData({ ...newItem });
          } else {
            router.replace("/Transactions");
          }
        },
        onError: error => {
          addNotification({
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
          onChange={params => {
            const formatedDate = dayjs(params.date).toISOString();
            handleTextChange("date", formatedDate);
          }}
        />

        <Box className="flex-row justify-center items-center">
          <Pressable
            className={`${formData.type === "Transfer" ? "bg-info-400" : mode === "plus" ? "bg-success-400" : "bg-error-400"} border border-muted rounded-lg me-2 p-1.5 mt-4`}
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
            {formData.type === "Transfer" ? (
              <Icon name="Hash" size={24} className="text-gray-100" />
            ) : mode === "minus" ? (
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
              let numericAmount = text
                .replace(/[^0-9.-]/g, "") // Allow digits, minus sign, and decimal point
                .replace(/(?!^)-/g, "") // Remove any minus sign that isn't at the start
                .replace(/(\d+)\.\.(\d+)/g, "$1.$2") // Keep only the first decimal point
                .replace(/^0+(?=\d)/, ""); // Remove leading zeros

              handleTextChange("amount", numericAmount);
            }}
            className="flex-1"
          />
          <VCalc
            onSubmit={(result: string) => handleTextChange("amount", Math.abs(parseFloat(result)).toString())}
            currentValue={formData.amount?.toString()}
          />
        </Box>

        <Box className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
          <MyDropDown
            isModal={Platform.OS !== "web"}
            label="Type"
            options={[
              { id: "Income", label: "Income", value: "Income", disabled: isEdit },
              { id: "Expense", label: "Expense", value: "Expense", disabled: isEdit },
              { id: "Transfer", label: "Transfer", value: "Transfer", disabled: isEdit },
              { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: true },
              { id: "Initial", label: "Initial", value: "Initial", disabled: true },
              { id: "Refund", label: "Refund", value: "Refund", disabled: true },
            ]}
            selectedValue={formData.type}
            onSelect={value => {
              handleTextChange("type", value?.value);
            }}
          />
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
            onSelect={value => handleTextChange("status", value?.value)}
          />
        </Box>

        <Box className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
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
                details: `${account.owner} | ${account.balance.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}`,
                value: account,
                passedItem: account,
                icon: account.icon,
                iconColorClass: `text-${account.iconColor?.replace("100", "500") ?? "gray-500"}`,
                group: account.category.name,
              })) ?? []
            }
            groupBy="group"
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
                  details: `${account.owner} | ${account.balance.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}`,
                  value: account,
                  passedItem: account,
                  icon: account.icon,
                  iconColorClass: `text-${account.iconColor.replace("100", "500")}`,
                  group: account.category.name,
                })) ?? []
              }
              groupBy="group"
              onSelect={(value: any) => {
                handleTextChange("transferaccountid", value.id);
                setDestinationAccount(value.value);
              }}
            />
          )}
        </Box>

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

        <Box className="flex-row text-center justify-center items-center gap-5 mt-2">
          <Button
            className="bg-error-400"
            onPress={() => {
              setFormData(initialTransactionState);
              router.replace("/AddTransaction");
            }}
          >
            <ButtonText className="text-foreground font-medium text-md">Reset</ButtonText>
          </Button>
          <Button className="bg-primary" disabled={isLoading} onPress={handleSubmit}>
            {isLoading ? (
              <ButtonSpinner />
            ) : (
              <ButtonText className="text-foreground font-medium text-md">Save</ButtonText>
            )}
          </Button>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
