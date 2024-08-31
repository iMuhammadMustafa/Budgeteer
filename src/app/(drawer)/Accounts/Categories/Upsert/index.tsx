import AccountCategoryForm, { AccountCategoryFormType } from "@/src/components/AccountCategoryForm";
import { TableNames } from "@/src/consts/TableNames";
import { Inserts, Updates } from "@/src/lib/supabase";
import { useGetAccountCategoryById } from "@/src/repositories/accountcategories.service";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialAccountState: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories> = {
  name: "",
  type: "Liability",
};

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountCategoryFormType>(initialAccountState);

  const { data, isLoading, error } = useGetAccountCategoryById(categoryId);

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
