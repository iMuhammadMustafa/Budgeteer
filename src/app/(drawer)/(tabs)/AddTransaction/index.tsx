import Button from "@/src/components/elements/Button";
import MultipleTransactions from "@/src/components/forms/MultipleTransactions";
import TransactionForm, { initialTransactionState, TransactionFormType } from "@/src/components/forms/TransactionForm";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function AddTransaction() {
  const [index, setIndex] = useState(1);

  const params = useLocalSearchParams();
  const transaction = params as unknown as TransactionFormType;

  const id = transaction?.id && !transaction?.accountid && !transaction?.categoryid ? transaction.id : undefined;
  const transactionService = useTransactionService();
  const { data: transactionById, isLoading, error } = transactionService.useFindById(id);

  const routes = [
    {
      id: 1,
      name: "Single",
      component: FirstRoute,
    },
    {
      id: 2,
      name: "Multiple",
      component: SecondRoute,
    },
  ];

  return (
    <View className="flex-1">
      <View className="flex-row">
        {routes.map(route => (
          <Button
            key={route.name}
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${index === route.id ? "border-success" : "border-transparent"}`}
            onPress={() => setIndex(route.id)}
            label={route.name}
          />
        ))}
      </View>
      <View className="flex-1 py-2">
        {index === 1 ? (
          <FirstRoute transaction={transaction.id ? transaction : (transactionById ?? initialTransactionState)} />
        ) : (
          <SecondRoute transaction={transaction ?? null} />
        )}
      </View>
    </View>
  );
}

const FirstRoute = ({ transaction }: any) => <TransactionForm transaction={transaction} />;

const SecondRoute = ({ transaction }: any) => <MultipleTransactions transaction={transaction ?? null} />;
