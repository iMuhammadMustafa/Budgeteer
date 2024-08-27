import { TableRow, TableData } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Transaction } from "@/src/lib/supabase";
import { useDeleteTransaction, useGetTransactions } from "@/src/repositories/transactions.service";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export default function Transactions() {
  const { data: transactions, error, isLoading } = useGetTransactions();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const mutation = useDeleteTransaction();

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={transactions!}
      columns={["", "Type", "Account", "Amount", "", "Category", "Date", "Notes", "Tags"]}
      createLinks={["../AddTransaction"]}
      renderItem={(transaction: Transaction) => {
        return (
          <TableRow key={transaction.id} className="text-center">
            <TableData className="flex justify-evenly items-center">
              <TransactionTypeIcon transaction={transaction} />
            </TableData>
            <TableData>{transaction.type}</TableData>
            <TableData>{transaction.account?.name ?? ""}</TableData>
            <TableData>{transaction.amount}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              {transaction.category?.icon ? (
                <Icon name={transaction.category?.icon} size={20} className="text-muted-foreground" />
              ) : (
                ""
              )}
            </TableData>
            <TableData>{transaction.category?.name ?? ""}</TableData>
            <TableData>{new Date(transaction.date).toLocaleDateString("en-GB")}</TableData>
            <TableData>{transaction.notes}</TableData>
            <TableData>{transaction.tags}</TableData>

            <TableData className="flex justify-center items-center gap-2">
              <Link href={`../AddTransaction?transactionId=${transaction.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    mutation.mutateAsync(transaction.id, {
                      onSuccess: () => setIsActionLoading(false),
                      onError: () => setIsActionLoading(false),
                    })
                  }
                >
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

const TransactionTypeIcon = ({ transaction }: { transaction: Transaction }) => {
  const iconProp = { name: "CircleHelp", color: "text-muted-foreground", size: 20 };
  if (transaction.type === "Income") {
    iconProp.name = "Plus";
    iconProp.color = "text-success-500";
  }
  if (transaction.type === "Expense") {
    iconProp.name = "Minus";
    iconProp.color = "text-error-500";
  }
  if (transaction.type === "Transfer") {
    iconProp.name = "ArrowLeftRight";
    iconProp.color = "text-info-500";
  }
  if (transaction.type === "Adjustment") {
    iconProp.name = "Wrench";
    iconProp.color = "text-warning-500";
  }
  return <Icon name={iconProp.name} size={iconProp.size} className={iconProp.color} />;
};
