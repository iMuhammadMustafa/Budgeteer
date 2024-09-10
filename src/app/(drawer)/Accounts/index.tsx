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
      columns={["Name", "Category", "Currency", "Balance", "Notes", "Created At"]}
      properties={["name", "category.name", "currency", "balance", "notes", "createdat"]}
      createLinks={["/Accounts/Categories", "/Accounts/Upsert"]}
      actions={{
        editLink: `/Accounts/Upsert?accountId=`,
        onDelete: (item: Account) => {
          setIsActionLoading(true);
          return mutate(item.id, { onSuccess: () => setIsActionLoading(false) });
        },
        isLoading: isActionLoading,
      }}
    />
  );
}
