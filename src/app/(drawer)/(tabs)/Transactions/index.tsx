import { TableData, TableRow } from "@/components/ui/table";
import List from "@/src/components/List";
import Icon from "@/src/lib/IonIcons";
import { Account, Transaction } from "@/src/lib/supabase";
import { useGetList } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { View, Text } from "react-native";

export default function Transactions() {
  const { data: transactions, error, isLoading, isError, isSuccess } = useGetList<Transaction>("transactions");
  const { data: accounts } = useGetList<Account>("accounts");

  // const [isActionLoading, setIsActionLoading] = useState(false);
  // // const queryClient = useQueryClient();
  // // // const mutation = useMutation({
  // // //   mutationFn: deleteCategory,
  // // //   onSuccess: () => {
  // // //     queryClient.invalidateQueries({ queryKey: ["categories"] });
  // // //     setIsActionLoading(false);
  // // //   },
  // // //   onMutate: () => setIsActionLoading(true),
  // // // });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={transactions!}
      columns={["AccountId", "Amount", "CategoryId", "Date", "DestinationId", "Notes", "Tags"]}
      createLink="../AddTransaction"
      renderItem={(transaction: Transaction) => {
        return (
          <TableRow key={transaction.id} className="text-center">
            <TableData>{transaction.accountid}</TableData>
            <TableData>{transaction.amount}</TableData>
            <TableData>{transaction.categoryid}</TableData>
            <TableData>{new Date(transaction.date).toLocaleDateString("en-GB")}</TableData>
            <TableData>{transaction.notes}</TableData>
            <TableData>{transaction.tags}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Categories/Upsert/${transaction.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {/* {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => mutation.mutateAsync(category.id)}>
                  <Icon name="Trash2" size={20} className="text-red-600" />
                </TouchableOpacity>
              )} */}
            </TableData>
          </TableRow>
        );
      }}
    />
  );
}
