import TransactionForm, { TransactionFormType } from "@/src/components/TransactionForm";
import { useGetTransactionById } from "@/src/repositories/transactions.service";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import dayjs from "dayjs";

const initialState: TransactionFormType = {
  description: "",
  date: dayjs().toString(),
  type: "Expense",
  categoryid: "",
  accountid: "",
  amount: 0,
  notes: "",
  tags: [""],
};

export default function AddTransaction() {
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const [initialValues, setInitialValues] = useState<TransactionFormType>(initialState);

  const { data: transaction, isLoading, error } = useGetTransactionById(transactionId);

  useEffect(() => {
    if (transactionId && transaction) {
      setInitialValues({
        ...transaction,
      });
    } else {
      setInitialValues(initialState);
    }
  }, [transactionId, transaction]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <TransactionForm transaction={initialValues} />;
}
