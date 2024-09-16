import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/pages/TransactionForm";
import { useGetTransactionById } from "@/src/repositories/transactions.service";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text } from "react-native";

export default function AddTransaction() {
  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : null;
  const { data: transactionById, isLoading, error } = useGetTransactionById(id);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <TransactionForm transaction={transaction.id ? transaction : (transactionById ?? initialTransactionState)} />;
}
