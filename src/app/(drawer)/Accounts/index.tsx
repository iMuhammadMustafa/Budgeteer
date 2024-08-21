import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { deleteAccount, useGetList } from "@/src/repositories/api";
import { Link } from "expo-router";
import { Account } from "@/src/lib/supabase";
import { TableData, TableRow } from "@/components/ui/table";
import Icon from "@/src/lib/IonIcons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import List from "@/src/components/List";

export default function Accounts() {
  const { data, isLoading, error } = useGetList<Account>("accounts");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsActionLoading(false);
    },
    onMutate: () => setIsActionLoading(true),
  });

  const handleDelete = async (id: string) => {
    await mutation.mutateAsync(id);
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={data!}
      columns={[
        "Name",
        "Category",
        "Type",
        "Currency",
        "Current Balance",
        "Open Balance",
        "Notes",
        "Created At",
        "Actions",
      ]}
      createLink={{ pathname: "/Accounts/Upsert/[accountId]", params: { accountId: "new" } }}
      renderItem={(account: Account) => {
        return (
          <TableRow key={account.id} className="text-center">
            <TableData>{account.name}</TableData>
            <TableData>{account.category}</TableData>
            <TableData>{account.type}</TableData>
            <TableData>{account.currency}</TableData>
            <TableData>{account.currentbalance}</TableData>
            <TableData>{account.openbalance}</TableData>
            <TableData>{account.notes}</TableData>
            <TableData>{new Date(account.createdat).toLocaleDateString("en-GB")}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Accounts/Upsert/${account.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => handleDelete(account.id)}>
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
