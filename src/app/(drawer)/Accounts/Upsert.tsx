import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import AccountForm, { initialState } from "@/src/components/forms/AccountForm";
import { useAccountService } from "@/src/services/Accounts.Service";
import { AccountFormData } from "@/src/types/components/forms.index";

export default function Upsert() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountFormData>(initialState);

  const accountService = useAccountService();
  const { data, isLoading, error } = accountService.findById(accountId);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: accountId ? "Edit Account" : "Add Account",
    });
  }, []);

  useEffect(() => {
    if (accountId && data) {
      setInitialValues({
        ...data,
        runningbalance: data.runningbalance,
      });
    }
  }, [accountId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <AccountForm account={initialValues} />;
}
