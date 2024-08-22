import { TableData, TableRow } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Account, Transaction } from "@/src/lib/supabase";
import { deleteTransaction, getAllTransactions } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function Transactions() {
  const { data: transactions, error, isLoading, isError, isSuccess } = getAllTransactions();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions, accounts"] });
      setIsActionLoading(false);
    },
    onMutate: () => setIsActionLoading(true),
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={transactions!}
      columns={["Icon", "Account", "Amount", "Destination", "Date", "Notes", "Tags"]}
      createLink="../AddTransaction"
      renderItem={(transaction: Transaction) => {
        return (
          <TableRow key={transaction.id} className="text-center">
            <TableData className="flex justify-center items-center">
              <Icon
                name={
                  transaction.category?.icon ??
                  (transaction.type === "Income" ? "Plus" : transaction.type === "Expense" ? "Minus" : "ArrowLeftRight")
                }
                size={20}
                className={
                  transaction.type === "Income"
                    ? "text-success-500"
                    : transaction.type === "Expense"
                      ? "text-error-500"
                      : "text-info-500"
                }
              />
            </TableData>
            <TableData>{transaction.account.name}</TableData>
            <TableData>{transaction.amount}</TableData>
            <TableData>{transaction.destinationAccount?.name ?? transaction.category.name}</TableData>
            <TableData>{new Date(transaction.date).toLocaleDateString("en-GB")}</TableData>
            <TableData>{transaction.notes}</TableData>
            <TableData>{transaction.tags}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Categories/Upsert/${transaction.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => mutation.mutateAsync(transaction.id)}>
                  <Icon name="Trash2" size={20} className="text-red-600" />
                </TouchableOpacity>
              )}
            </TableData>
          </TableRow>
        );
      }}
    />
  );
}
