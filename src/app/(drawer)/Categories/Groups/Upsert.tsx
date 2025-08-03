import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useGetTransactionGroupById } from "@/src/services/repositories/TransactionGroups.Service";
import TransactionGroupForm, {
  TransactionGroupFormType,
  initialState,
} from "@/src/components/forms/TransactionGroupForm";

export default function Upsert() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [initialValues, setInitialValues] = useState<TransactionGroupFormType>(initialState);

  const { data, isLoading, error } = useGetTransactionGroupById(groupId);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: groupId ? "Edit TransactionGroup" : "Add TransactionGroup",
    });
  }, []);

  useEffect(() => {
    if (groupId && data) {
      setInitialValues({
        ...data,
      });
    }
  }, [groupId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <TransactionGroupForm group={initialValues} />;
}
