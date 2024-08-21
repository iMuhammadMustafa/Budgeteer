import DropdownField from "@/src/components/DropdownField";
import TextInputField from "@/src/components/TextInputField";
import { Account, Category, Transaction } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { createTransaction, upsertAccount, useGetList } from "@/src/repositories/api";
import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import "react-native-get-random-values";
import { create } from "react-test-renderer";
import { v4 } from "uuid";

type TransactionTypes = "Income" | "Expense" | "Transfer";

export default function AddTransaction() {
  // const { session, loading } = useAuth();

  // if (loading) return <Text>Loading...</Text>;

  console.log("d8d5efae-da25-4b50-870f-8774b83d73e9");

  const initalValues: Transaction = {
    id: v4(),
    amount: 0,
    categoryid: "",
    accountid: "",
    destinationid: null,
    date: new Date(Date.now()).toISOString(),
    tags: [],

    notes: "",

    createdat: new Date(Date.now()).toISOString(),
    createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
    updatedat: null,
    updatedby: null,

    isdeleted: false,
    tenantid: "d8d5efae-da25-4b50-870f-8774b83d73e9",
  };

  const [type, setType] = useState<TransactionTypes>("Expense");
  const [transaction, setTransaction] = useState({ ...initalValues });

  const { data: accounts, isLoading: isAccountLoading } = useGetList<Account>("accounts");
  const { data: categories, isLoading: isCategoriesLoading } = useGetList<Category>("categories");

  const handleSubmit = () => {
    const sourceAccount = accounts?.find(account => account.id === transaction.accountid);
    const destinationAccount = accounts?.find(account => account.id === transaction.destinationid);

    const amount = type === "Income" ? transaction.amount : -transaction.amount;

    const currentTransaction = {
      ...transaction,
      createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9"!,
      tenantid: "d8d5efae-da25-4b50-870f-8774b83d73e9"!,
      amount: amount,
    };

    createTransaction(currentTransaction);

    upsertAccount({ ...sourceAccount, currentbalance: sourceAccount?.currentbalance + amount });

    if (type === "Transfer") {
      upsertAccount({ ...destinationAccount, currentbalance: destinationAccount?.currentbalance + amount });
    }

    setTransaction({ ...initalValues });
  };

  if (isAccountLoading || isCategoriesLoading) return <Text>Loading...</Text>;
  return (
    <SafeAreaView className="p-5">
      <DropdownField
        label="Type"
        onSelect={type => setType(type.name)}
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
        list={accounts}
      />
      {type === "Transfer" && (
        <DropdownField
          label="Destination"
          onSelect={(account: Account) => setTransaction({ ...transaction, destinationid: account.id })}
          list={accounts}
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
