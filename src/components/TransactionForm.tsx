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

export type TransactionFormType =
  | (Inserts<TableNames.Transactions> & { amount: number; destAccountId?: string })
  | (Updates<TableNames.Transactions> & { amount: number; destAccountId?: string });

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const [formData, setFormData] = useState<TransactionFormType>(transaction);
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const { data: accounts, isLoading: isAccountLoading } = useGetAccounts();
  const [isLoading, setIsLoading] = useState(false);
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

  if (isCategoriesLoading || isAccountLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="p-5 flex-1">
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
            handleTextChange("amount", text);
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
          onSelect={(value: any) => handleTextChange("categoryid", value.id)}
        />
        <DropdownField
          label="Account"
          list={accounts}
          value={formData.accountid}
          options={accounts?.map(account => ({ label: account.name, value: account.id }))}
          onSelect={(value: any) => handleTextChange("accountid", value.id)}
        />
        {formData.type === "Transfer" && (
          <DropdownField
            label="Destinaton Account"
            list={accounts}
            value={formData.destAccountId}
            options={accounts?.map(account => ({ label: account.name, value: account.id }))}
            onSelect={(value: any) => handleTextChange("destAccountId", value.id)}
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
