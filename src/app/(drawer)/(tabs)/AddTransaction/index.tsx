import MultipleTransactions from "@/src/components/forms/MultipleTransactions";
import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/forms/TransactionForm";
import MyTabsRouter from "@/src/components/TabRouting";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";

export default function AddTransaction() {
  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : undefined;
  const transactionService = useTransactionService();

  const { data: transactionById, isLoading } = transactionService.useFindById(id);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  const routes = [
    {
      id: 1,
      name: "Single",
      render: () => <TransactionForm transaction={transactionById ?? initialTransactionState} />,
    },
    {
      id: 2,
      name: "Multiple",
      render: () => <MultipleTransactions transaction={transactionById ?? initialTransactionState} />,
    },
  ];

  return <MyTabsRouter tabs={routes} />;
}
