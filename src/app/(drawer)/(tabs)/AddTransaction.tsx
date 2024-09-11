import TransactionForm, { TransactionFormType } from "@/src/components/pages/TransactionForm";
import { useGetTransactionById } from "@/src/repositories/transactions.service";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import dayjs from "dayjs";
import TransactionFormNew from "@/src/components/pages/TransactionFormNew";

const initialState: TransactionFormType = {
  description: "",
  date: dayjs().toISOString(),
  type: "Expense",
  categoryid: "",
  accountid: "",
  amount: 0,
  notes: "",
  tags: null,
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

  return (
    <>
      <TransactionForm transaction={initialValues} />
      {/* <TransactionFormNew transaction={initialValues} /> */}
    </>
  );
}
