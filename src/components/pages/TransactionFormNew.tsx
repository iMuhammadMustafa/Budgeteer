import { useEffect, useState } from "react";
import { Inserts, TransactionTypes, Updates } from "../../lib/supabase";
import { useUpsertTransaction } from "../../repositories/transactions.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import {
  ActivityIndicator,
  Keyboard,
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
import DropdownModal from "../Dropdown";
import VCalc from "../VCalc";
import { TableNames } from "@/src/consts/TableNames";

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

  const categoryOptions = categories?.map(category => ({ label: category.name, value: category.id }));
  const accountOptions = accounts?.map(account => ({ label: account.name, value: account.id }));

  return (
    <SafeAreaView style={{ padding: 20, flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
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
          <Box style={{ marginBottom: 16 }}>
            <Box style={{ maxWidth: "100%" }}>
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

        <DropdownModal
          label="Category"
          options={categoryOptions}
          selectedValue={formData.categoryid}
          onSelect={(value: string) => handleTextChange("categoryid", value)}
        />

        <DropdownModal
          label="Account"
          options={accountOptions}
          selectedValue={formData.accountid}
          onSelect={(value: string) => handleTextChange("accountid", value)}
        />

        {formData.type === "Transfer" && (
          <DropdownModal
            label="Destination Account"
            options={accountOptions}
            selectedValue={formData.destAccountId}
            onSelect={(value: string) => handleTextChange("destAccountId", value)}
          />
        )}

        <TextInputField
          label="Tags"
          value={formData.tags?.toString()}
          onChange={text => handleTextChange("tags", text.split(","))}
        />

        <TextInputField label="Notes" value={formData.notes} onChange={text => handleTextChange("notes", text)} />

        <Button
          style={{ padding: 15, justifyContent: "center", alignItems: "center" }}
          disabled={isLoading}
          onPress={handleSubmit}
        >
          {isLoading ? <ButtonSpinner /> : <ButtonText style={{ fontWeight: "500", fontSize: 16 }}>Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
