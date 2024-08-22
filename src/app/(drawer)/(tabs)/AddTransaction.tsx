import DropdownField from "@/src/components/DropdownField";
import TextInputField from "@/src/components/TextInputField";
import { Account, Category, Transaction } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { createTransaction, upsertAccount, useGetList } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import "react-native-get-random-values";
import { v4 } from "uuid";

type TransactionTypes = "Income" | "Expense" | "Transfer";

export default function AddTransaction() {
  const { session, isSessionLoading } = useAuth();
  if (isSessionLoading) return <Text>Loading...</Text>;
  const initalValues: Transaction = {
    id: v4(),
    amount: 0,
    type: "Expense",
    categoryid: "",
    accountid: "",
    destinationid: null,
    date: new Date(Date.now()).toISOString(),
    tags: [],

    notes: "",

    createdat: new Date(Date.now()).toISOString(),
    createdby: session?.user.id ?? "",
    updatedat: null,
    updatedby: null,

    isdeleted: false,
    tenantid: session?.user.id ?? "",
  };

  const [transaction, setTransaction] = useState({ ...initalValues });

  useEffect(() => {
    setTransaction({ ...initalValues });
  }, []);

  const { data: accounts, isLoading: isAccountLoading } = useGetList<Account>("accounts");
  const { data: categories, isLoading: isCategoriesLoading } = useGetList<Category>("categories");

  const client = useQueryClient();

  const handleSubmit = () => {
    const srcAccount = accounts?.find(account => account.id === transaction.accountid);
    const destAccount = accounts?.find(account => account.id === transaction.destinationid);

    console.log(transaction);
    if (!srcAccount) {
      throw new Error("Source account not found");
      return;
    }
    createTransaction({ transaction, srcAccount, destAccount });

    setTransaction({ ...initalValues });
    client.refetchQueries({ queryKey: ["transactions", "accounts"] });
  };

  if (isAccountLoading || isCategoriesLoading) return <Text>Loading...</Text>;
  return (
    <SafeAreaView className="p-5">
      <DropdownField
        label="Type"
        onSelect={({ name }: { name: TransactionTypes }) => setTransaction({ ...transaction, type: name })}
        list={[
          { id: "Income", name: "Income" },
          { id: "Expense", name: "Expense" },
          { id: "Transfer", name: "Transfer" },
        ]}
      />
      <TextInputField
        label="Amount"
        value={transaction.amount.toString()}
        onChange={text => setTransaction({ ...transaction, amount: parseFloat(text) })}
        keyboardType="numeric"
      />
      <DropdownField
        label="Category"
        onSelect={(category: Category) => setTransaction({ ...transaction, categoryid: category.id })}
        list={categories}
      />
      <DropdownField
        label="Account"
        onSelect={(account: Account) => setTransaction({ ...transaction, accountid: account.id })}
        list={accounts?.map(account => ({
          ...account,
          name: `${account.name} - ${account.category} - ${account.currentbalance}`,
        }))}
      />
      {transaction.type === "Transfer" && (
        <DropdownField
          label="Destination"
          onSelect={(account: Account) => setTransaction({ ...transaction, destinationid: account.id })}
          list={accounts?.map(account => ({
            ...account,
            name: `${account.name} - ${account.category} - ${account.currentbalance}`,
          }))}
        />
      )}

      <TextInputField
        label="Notes"
        value={transaction.notes}
        onChange={text => setTransaction({ ...transaction, notes: text })}
        keyboardType="default"
      />
      <TouchableOpacity onPress={handleSubmit} className="bg-primary text-lg p-2 rounded-md">
        <Text className="text-foreground text-center">Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
