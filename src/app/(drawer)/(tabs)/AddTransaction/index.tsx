import TransactionFormSkeleton from "@/src/components/elements/TransactionFormSkeleton";
import MultipleTransactions from "@/src/components/forms/MultipleTransactions";
import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/forms/TransactionForm";
import { SecondaryTabBar } from "@/src/components/ui";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useLocalSearchParams } from "expo-router";

export default function AddTransaction() {
  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  // const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : undefined;
  const id = transaction?.id;
  const transactionService = useTransactionService();

  const { data: transactionById, isLoading } = transactionService.useFindById(id);

  if (isLoading) {
    return <TransactionFormSkeleton />;
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

  return <SecondaryTabBar mode="inline" tabs={routes} />;
}
