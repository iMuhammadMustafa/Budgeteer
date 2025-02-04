import { useCreateAccount, useDeleteAccount, useGetAccounts } from "@/src/services/repositories/Accounts.Repository";
import { TableNames } from "@/src/types/db/TableNames";
import { Inserts } from "@/src/types/db/Tables.Types";
import { View, Text, Pressable } from "react-native";

const newAccount: Inserts<TableNames.Accounts> = {
  balance: 0,
  categoryid: "0194cd7a-8e70-77f5-9596-cc09d3788363",
  name: "New ??",
  createdat: new Date().toISOString(),
  tenantid: "0194c8af-3fe9-750e-b0e5-b62d5cefc095",
};

export default function Accounts() {
  const { data: accounts } = useGetAccounts();
  const mutation = useCreateAccount();
  const deleteMutation = useDeleteAccount();
  return (
    <View>
      <Text>Accounts</Text>
      <Pressable onPress={() => mutation.mutate(newAccount)}>
        <Text>Add Account</Text>
      </Pressable>
      {accounts?.map(account => (
        <View key={account.id}>
          <Text>
            {account.name} - {account.balance}
          </Text>
          <Pressable onPress={() => deleteMutation.mutate(account.id)}>
            <Text>Delete</Text>
          </Pressable>
          <hr />
        </View>
      ))}
    </View>
  );
}
