import { useEffect, useState } from "react";
import { Inserts, TransactionsView, TransactionTypes, Updates } from "../../lib/supabase";
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
import VDropdown from "../VercelDropDown";
import VCalc from "../VCalc";
import DropdownModal from "../Dropdown";
import SearchableDropdown, { SearchableDropdownItem } from "../SearchableDropdown";
import { getTransactionsByDescription } from "../../repositories/transactions.api";
import Modal from "react-native-modal";
import Icon from "@/src/lib/IonIcons";

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

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

  useEffect(() => {
    setFormData(transaction);
    setSourceAccount(accounts?.find(account => account.id === transaction.accountid));
    setDestinationAccount(accounts?.find(account => account.id === transaction.transferaccountid));
  }, [transaction, accounts]);

  const handleTextChange = (name: keyof TransactionFormType, text: any) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
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
    console.log(
      "fullFormTransaction",
      {
        ...formData,
        amount: Math.abs(formData.amount ?? 0),
      },
      {
        originalData: transaction,
        sourceAccount,
        destinationAccount,
      },
    );
  };

  const handleMutate = (isOneMore = false) => {
    setIsLoading(true);

    mutate(
      {
        fullFormTransaction: {
          ...formData,
          amount: Math.abs(formData.amount ?? 0),
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

        <Text className="text-foreground">Date</Text>
        <Pressable
          onPress={() => {
            Keyboard.dismiss;
            setShowDate(prev => !prev);
          }}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#ddd",
            backgroundColor: "#fff",
            alignItems: "center",
          }}
        >
          <Text>{dayjs(formData.date).format("DD-MM-YYYY hh:mm:ss")}</Text>
        </Pressable>

        {showDate &&
          (Platform.OS === "web" ? (
            <Box className="m-auto">
              <Box className="lg:max-w-sm">
                <DateTimePicker
                  mode="single"
                  date={dayjs(formData.date)}
                  displayFullDays
                  timePicker
                  onChange={(params: any) =>
                    setFormData(prevFormData => ({ ...prevFormData, date: dayjs(params.date).toString() }))
                  }
                />
              </Box>
            </Box>
          ) : (
            <Modal
              isVisible={showDate}
              onDismiss={() => setShowDate(false)}
              onBackButtonPress={() => setShowDate(false)}
              onBackdropPress={() => setShowDate(false)}
              // className="bg-white m-auto"
            >
              <View className="m-auto items-center justify-center bg-white rounded-md p-1">
                <DateTimePicker
                  mode="single"
                  date={dayjs(formData.date)}
                  displayFullDays
                  timePicker
                  onChange={(params: any) =>
                    setFormData(prevFormData => ({ ...prevFormData, date: dayjs(params.date).toString() }))
                  }
                />
              </View>
            </Modal>
          ))}

        <Box className="flex-row justify-center items-center">
          <TextInputField
            label="Amount"
            value={Math.abs(formData.amount ?? 0).toString()}
            keyboardType="numeric"
            onChange={text => handleTextChange("amount", text)}
            className="flex-1"
          />
          <VCalc
            onSubmit={(result: string) => handleTextChange("amount", result.toString())}
            currentValue={formData.amount?.toString()}
          />
        </Box>

        {Platform.OS === "web" ? (
          <VDropdown
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
        ) : (
          <DropdownModal
            label="Type"
            options={[
              { label: "Income", value: "Income" },
              { label: "Expense", value: "Expense" },
              { label: "Transfer", value: "Transfer" },
              { label: "Adjustment", value: "Adjustment", disabled: true },
              { label: "Initial", value: "Initial", disabled: true },
              { label: "Refund", value: "Refund", disabled: true },
            ]}
            selectedValue={formData.type}
            onSelect={(value: TransactionTypes) => handleTextChange("type", value)}
          />
        )}

        {Platform.OS === "web" ? (
          <VDropdown
            label="Category"
            selectedValue={formData.categoryid}
            options={
              categories?.map(category => ({
                id: category.id,
                label: category.name,
                value: category,
                icon: category.icon,
              })) ?? []
            }
            onSelect={(value: any) => handleTextChange("categoryid", value.id)}
          />
        ) : (
          <DropdownModal
            label="Category"
            selectedValue={formData.categoryid}
            options={categories?.map(category => ({ label: category.name, value: category.id, icon: category.icon }))}
            onSelect={(value: any) => handleTextChange("categoryid", value)}
          />
        )}

        {Platform.OS === "web" ? (
          <VDropdown
            label="Account"
            selectedValue={formData.accountid}
            options={accounts?.map(account => ({
              id: account.id,
              label: account.name,
              value: account,
              passedItem: account,
            }))}
            onSelect={(value: any) => {
              handleTextChange("accountid", value.id);
              setSourceAccount(value.value);
            }}
          />
        ) : (
          <DropdownModal
            label="Account"
            selectedValue={formData.accountid}
            options={accounts?.map(account => ({ label: account.name, value: account.id, passedItem: account }))}
            onSelect={(value: any) => {
              handleTextChange("accountid", value);
              setSourceAccount(value);
            }}
          />
        )}

        {formData.type === "Transfer" &&
          (Platform.OS === "web" ? (
            <VDropdown
              label="Destinaton Account"
              selectedValue={formData.transferaccountid}
              options={accounts?.map(account => ({
                id: account.id,
                label: account.name,
                value: account,
                passedItem: account,
              }))}
              onSelect={(value: any) => {
                handleTextChange("transferaccountid", value.id);
                setDestinationAccount(value.value);
              }}
            />
          ) : (
            <DropdownModal
              label="Destinaton Account"
              selectedValue={formData.transferaccountid}
              options={accounts?.map(account => ({ label: account.name, value: account.id, passedItem: account }))}
              onSelect={(value: any) => {
                handleTextChange("transferaccountid", value);
                setDestinationAccount(value);
              }}
            />
          ))}

        {Platform.OS === "web" ? (
          <VDropdown
            label="Status"
            options={[
              { id: "None", label: "None", value: "None" },
              { id: "Cleared", label: "Cleared", value: "Cleared" },
              { id: "Reconciled", label: "Reconciled", value: "Reconciled" },
              { id: "Void", label: "Void", value: "Void" },
            ]}
            selectedValue={formData.status}
            onSelect={value => {
              console.log(value);
              handleTextChange("status", value.value);
            }}
          />
        ) : (
          <DropdownModal
            label="Status"
            options={[
              { label: "None", value: "None" },
              { label: "Cleared", value: "Cleared" },
              { label: "Reconciled", value: "Reconciled" },
              { label: "Void", value: "Void" },
            ]}
            selectedValue={formData.type}
            onSelect={(value: TransactionTypes) => handleTextChange("status", value)}
          />
        )}

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
