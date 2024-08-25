import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Account } from "@/src/lib/supabase";
import { TableData, TableRow } from "@/components/ui/table";
import Icon from "@/src/lib/IonIcons";
import List from "@/src/components/List";
import { useDeleteAccount, useGetAccounts } from "@/src/repositories/account.service";

export default function Accounts() {
  const { data, isLoading, error } = useGetAccounts();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { mutate } = useDeleteAccount();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={data!}
      columns={["Name", "Category", "Type", "Currency", "Balance", "Notes", "Created At", "Actions"]}
      createLink="/Accounts/Upsert"
      renderItem={(account: Account) => {
        return (
          <TableRow key={account.id} className="text-center">
            <TableData>{account.name}</TableData>
            <TableData>{account.category.name}</TableData>
            <TableData>{account.category.type}</TableData>
            <TableData>{account.currency}</TableData>
            <TableData>{account.balance}</TableData>
            <TableData>{account.notes}</TableData>
            <TableData>{new Date(account.createdat).toLocaleDateString("en-GB")}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Accounts/Upsert?accountId=${account.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => mutate(account.id)}>
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
