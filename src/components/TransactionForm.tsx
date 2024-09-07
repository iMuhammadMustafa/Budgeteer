import { useEffect, useState } from "react";
import { Inserts, TransactionTypes, Updates } from "../lib/supabase";
import { useUpsertTransaction } from "../repositories/transactions.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../providers/NotificationsProvider";
import { ActivityIndicator, Keyboard, Platform, Pressable, SafeAreaView, ScrollView, Text } from "react-native";
import TextInputField from "./TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetCategories } from "../repositories/categories.service";
import { useGetAccounts } from "../repositories/account.service";
import DropdownField from "./DropdownField";
import { TableNames } from "../consts/TableNames";
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { Box } from "@/components/ui/box";
import SearchableDropdown from "./SearchableDropdown";
import VDropdown from "./VercelDropDown";
import { EventProvider } from "react-native-outside-press";
import VCalc from "./VCalc";
import Dropdown from "./Dropdown";

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

  useEffect(() => {
    setFormData(transaction);
  }, [transaction]);

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

  const handleTextChange = (name: keyof TransactionFormType, text: any) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };
  const handleSubmit = () => {
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

  if (isCategoriesLoading || isAccountLoading || isLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="p-5 px-6">
        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => {
            handleTextChange("description", text);
          }}
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

        {showDate && (
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
        )}

        <Box className="flex-row justify-center items-center">
          <TextInputField
            label="Amount"
            value={formData.amount?.toString()}
            keyboardType="numeric"
            onChange={text => handleTextChange("amount", text)}
            className="flex-1"
          />
          <VCalc
            onSubmit={result => handleTextChange("amount", result.toString())}
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
          <Dropdown
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
            options={categories?.map(category => ({ label: category.name, value: category.id })) ?? []}
            onSelect={(value: any) => handleTextChange("categoryid", value)}
          />
        ) : (
          <Dropdown
            label="Category"
            selectedValue={formData.categoryid}
            options={categories?.map(category => ({ label: category.name, value: category.id }))}
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
          <Dropdown
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
            <Dropdown
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
