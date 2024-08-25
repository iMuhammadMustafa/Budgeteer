import AccountForm, { AccountFormType } from "@/src/components/AccountForm";
import { Account, Inserts, TableNames, Updates } from "@/src/lib/supabase";
import { useGetAccountById } from "@/src/repositories/account.service";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialAccountState: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts> = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
};

export default function Upsert() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountFormType>(initialAccountState);

  const { data, isLoading, error } = useGetAccountById(accountId);

  useEffect(() => {
    if (accountId && data) {
      setInitialValues({
        ...data,
      });
    }
  }, [accountId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <AccountForm account={initialValues} />;
}
