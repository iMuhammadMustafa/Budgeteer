import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useGetTransactionCategoryById } from "@/src/services/repositories/TransactionCategories.Repository";
import TransactionCategoryForm, {
  TransactionCategoryFormType,
  initialState,
} from "@/src/components/forms/TransactionCategoryForm";

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<TransactionCategoryFormType>(initialState);

  const { data, isLoading, error } = useGetTransactionCategoryById(categoryId);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryId ? "Edit Transaction Category" : "Add Transaction Category",
    });
  }, []);

  useEffect(() => {
    if (categoryId && data) {
      setInitialValues({
        ...data,
      });
    }
  }, [categoryId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <TransactionCategoryForm category={initialValues} />;
}
