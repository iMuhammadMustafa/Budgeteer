import { useEffect, useState } from "react";
import { Inserts, TransactionTypes, Updates } from "../lib/supabase";
import { useUpsertTransaction } from "../repositories/transactions.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../providers/NotificationsProvider";
import { ActivityIndicator, SafeAreaView, ScrollView } from "react-native";
import TextInputField from "./TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetCategories } from "../repositories/categories.service";
import { useGetAccounts } from "../repositories/account.service";
import DropdownField from "./DropdownField";
import { TableNames } from "../consts/TableNames";

export type TransactionFormType = Inserts<TableNames.Transactions> | Updates<TableNames.Transactions>;

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const [formData, setFormData] = useState<TransactionFormType>(transaction);
  const [destination, setDestination] = useState<string>("");
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();
  const [isLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setFormData(transaction);
  }, [transaction]);

  const { mutate } = useUpsertTransaction();
  const { addNotification } = useNotifications();

  const handleTextChange = (name: keyof TransactionFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };
  const handleSubmit = () => {
    mutate(
      {
        ...formData,
        amount: formData.type === "Income" ? Math.abs(formData.amount ?? 0) : -Math.abs(formData.amount ?? 0),
        date: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          if (type !== "Transfer") {
            addNotification({ message: "Transaction Created Successfully", type: "success" });
            router.replace("/Transactions");
          }
        },
      },
    );

    if (formData.type === "Transfer") {
      mutate(
        {
          ...formData,
          accountid: destination,
          amount: Math.abs(formData.amount ?? 0),
          date: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            addNotification({ message: "Transaction Created Successfully", type: "success" });
            router.replace("/Transactions");
          },
        },
      );
    }
  };

  if (isCategoriesLoading || isAccountLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => {
            handleTextChange("description", text);
          }}
        />
        <TextInputField
          label="Amount"
          value={formData.amount?.toString()}
          keyboardType="numeric"
          onChange={text => {
            handleTextChange("amount", parseFloat(text));
          }}
        />
        <DropdownField
          label="Type"
          onSelect={({ name }: { name: TransactionTypes }) => handleTextChange("type", name)}
          list={[
            { id: "Income", name: "Income" },
            { id: "Expense", name: "Expense" },
            { id: "Transfer", name: "Transfer" },
          ]}
        />

        <DropdownField
          label="Category"
          list={categories}
          value={formData.categoryid}
          options={categories?.map(category => ({ label: category.name, value: category.id }))}
          onSelect={value => handleTextChange("categoryid", value.id)}
        />
        <DropdownField
          label="Account"
          list={accounts}
          value={formData.accountid}
          options={accounts?.map(account => ({ label: account.name, value: account.id }))}
          onSelect={value => handleTextChange("accountid", value.id)}
        />
        {formData.type === "Transfer" && (
          <DropdownField
            label="Destinaton Account"
            list={accounts}
            value={destination}
            options={accounts?.map(account => ({ label: account.name, value: account.id }))}
            onSelect={value => setDestination(value.id)}
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
