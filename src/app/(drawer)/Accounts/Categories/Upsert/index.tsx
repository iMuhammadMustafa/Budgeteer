import AccountCategoryForm, { AccountCategoryFormType } from "@/src/components/pages/AccountCategoryForm";
import { TableNames } from "@/src/consts/TableNames";
import { Inserts, Updates } from "@/src/lib/supabase";
import { useGetAccountCategoryById } from "@/src/repositories/services/accountcategories.service";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useState, useEffect, useLayoutEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialAccountState: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories> = {
  name: "",
  type: "Liability",
};

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountCategoryFormType>(initialAccountState);

  const navigation = useNavigation();

  const { data, isLoading, error } = useGetAccountCategoryById(categoryId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: categoryId ? "Edit Category" : "Add Category",
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

  return <AccountCategoryForm category={initialValues} />;
}
