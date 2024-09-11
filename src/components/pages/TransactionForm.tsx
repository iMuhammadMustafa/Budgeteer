import { useEffect, useState } from "react";
import { Inserts, TransactionTypes, Updates } from "../../lib/supabase";
import { useSearchTransactionsByDescription, useUpsertTransaction } from "../../repositories/transactions.service";
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
import { TableNames } from "../../consts/TableNames";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { Box } from "@/components/ui/box";
import VDropdown from "../VercelDropDown";
import VCalc from "../VCalc";
import DropdownModal from "../Dropdown";
import SearchableDropdown, { SearchableDropdownItem } from "../SearchableDropdown";
import { getTransactionsByDescription } from "../../repositories/transactions.api";
import { default as MobileDateTimePicker } from "@react-native-community/datetimepicker";
import Modal from "react-native-modal";
import Icon from "@/src/lib/IonIcons";
import { initialTransactionState } from "@/src/app/(drawer)/(tabs)/AddTransaction";

export type TransactionFormType =
  | (Inserts<TableNames.Transactions> & { amount: number; destAccountId?: string })
  | (Updates<TableNames.Transactions> & { amount: number; destAccountId?: string });

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const [formData, setFormData] = useState<TransactionFormType>(transaction);
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();
  const [isLoading, setIsLoading] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const router = useRouter();
  // const [searchTerm, setSearchTerm] = useState("");
  // const { data: searchResults } = useSearchTransactionsByDescription(searchTerm);

  useEffect(() => {
    setFormData(transaction);
  }, [transaction]);

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

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
    setFormData(newItem);
    setIsLoading(true);
    mutate(
      {
        fullFormTransaction: {
          ...formData,
          amount: Math.abs(formData.amount ?? 0),
        },
        originalData: transaction,
      },
      {
        onSuccess: () => {
          addNotification({ message: "Transaction Created Successfully", type: "success" });
          setIsLoading(false);
          setFormData(newItem);
        },
      },
    );
  };
  const handleSubmit = () => {
    setIsLoading(true);
    mutate(
      {
        fullFormTransaction: {
          ...formData,
          amount: Math.abs(formData.amount ?? 0),
        },
        originalData: transaction,
      },
      {
        onSuccess: () => {
          addNotification({ message: "Transaction Created Successfully", type: "success" });
          setIsLoading(false);
          router.replace("/Transactions");
        },
      },
    );
  };

  const onSelectItem = (item: SearchableDropdownItem) => {
    console.log(item);
    setFormData({
      ...transaction,
      ...item.item,
      // id: transaction.id,
      // date: transaction.date,
      // createdat: transaction.createdat,
      // updatedat: transaction.updatedat,
      // updatedby: transaction.updatedby,
    });
  };

  // useEffect(() => {}, []);

  if (isCategoriesLoading || isAccountLoading || isLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="flex-1">
      <TouchableOpacity
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

        {/* {showDate && (
          <Box className="m-auto">
            <Box className="lg:max-w-sm">
              {Platform.OS === "web" ? (
                <DateTimePicker
                  mode="single"
                  date={dayjs(formData.date)}
                  displayFullDays
                  timePicker
                  onChange={(params: any) =>
                    setFormData(prevFormData => ({ ...prevFormData, date: dayjs(params.date).toString() }))
                  }
                />
              ) : (
                <>
                  <MobileDateTimePicker
                    value={dayjs(formData.date).toDate()}
                    mode={"time"}
                    is24Hour={true}
                    onChange={e => console.log(e)}
                  />
                </>
              )}
            </Box>
          </Box>
        )} */}

        <Box className="flex-row justify-center items-center">
          <TextInputField
            label="Amount"
            value={formData.amount?.toString()}
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
              { label: "Income", value: "Income" },
              { label: "Expense", value: "Expense" },
              { label: "Transfer", value: "Transfer" },
              { label: "Adjustment", value: "Adjustment" },
              { label: "Initial", value: "Initial" },
              { label: "Refund", value: "Refund" },
            ]}
            selectedValue={formData.type}
            onSelect={value => {
              handleTextChange("type", value);
            }}
          />
        ) : (
          <DropdownModal
            label="Type"
            options={[
              { label: "Income", value: "Income" },
              { label: "Expense", value: "Expense" },
              { label: "Transfer", value: "Transfer" },
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
              categories?.map(category => ({ label: category.name, value: category.id, icon: category.icon })) ?? []
            }
            onSelect={(value: any) => handleTextChange("categoryid", value)}
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
            options={accounts?.map(account => ({ label: account.name, value: account.id }))}
            onSelect={(value: any) => handleTextChange("accountid", value)}
          />
        ) : (
          <DropdownModal
            label="Account"
            selectedValue={formData.accountid}
            options={accounts?.map(account => ({ label: account.name, value: account.id }))}
            onSelect={(value: any) => handleTextChange("accountid", value)}
          />
        )}

        {formData.type === "Transfer" &&
          (Platform.OS === "web" ? (
            <VDropdown
              label="Destinaton Account"
              selectedValue={formData.destAccountId}
              options={accounts?.map(account => ({ label: account.name, value: account.id }))}
              onSelect={(value: any) => handleTextChange("destAccountId", value)}
            />
          ) : (
            <DropdownModal
              label="Destinaton Account"
              selectedValue={formData.destAccountId}
              options={accounts?.map(account => ({ label: account.name, value: account.id }))}
              onSelect={(value: any) => handleTextChange("destAccountId", value)}
            />
          ))}

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
