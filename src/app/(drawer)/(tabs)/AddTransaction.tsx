import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/pages/TransactionForm";
import { useGetTransactionById } from "@/src/repositories/transactions.service";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import dayjs from "dayjs";

export default function AddTransaction() {
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const [initialValues, setInitialValues] = useState<TransactionFormType>(initialTransactionState);

  const { data: transaction, isLoading, error } = useGetTransactionById(transactionId);

  useEffect(() => {
    if (transactionId && transaction) {
      setInitialValues({
        ...transaction,
      });
    } else {
      setInitialValues(initialTransactionState);
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
