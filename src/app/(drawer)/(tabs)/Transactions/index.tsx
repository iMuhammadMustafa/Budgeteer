import { TableData, TableRow } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Account, Transaction, TransactionTypes } from "@/src/lib/supabase";
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
      columns={["", "Type", "Account", "Amount", "Destination", "Date", "Notes", "Tags", "Actions"]}
      createLink="../AddTransaction"
      renderItem={(transaction: Transaction) => {
        const iconProp = { name: "CircleHelp", color: "text-muted-foreground", size: 20 };
        if (transaction.type === TransactionTypes.Income) {
          iconProp.name = "Plus";
          iconProp.color = "text-success-500";
        }
        if (transaction.type === TransactionTypes.Expense) {
          iconProp.name = "Minus";
          iconProp.color = "text-error-500";
        }
        if (transaction.type === TransactionTypes.Transfer) {
          iconProp.name = "ArrowLeftRight";
          iconProp.color = "text-info-500";
        }
        if (transaction.type === TransactionTypes.Adjustment) {
          iconProp.name = "Wrench";
          iconProp.color = "text-warning-500";
        }

        return (
          <TableRow key={transaction.id} className="text-center">
            <TableData className="flex justify-evenly items-center">
              <Icon name={iconProp.name} size={iconProp.size} className={iconProp.color} />
            </TableData>
            <TableData>{transaction.type}</TableData>
            <TableData>{transaction.account.name}</TableData>
            <TableData>{transaction.amount}</TableData>
            <TableData>{transaction.destinationAccount?.name ?? transaction.category?.name ?? ""}</TableData>
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
