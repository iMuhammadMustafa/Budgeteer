import CategoryForm, { CategoryFormType } from "@/src/components/CategoryForm";
import { Inserts, TableNames, Updates } from "@/src/lib/supabase";
import { useGetCategoryById } from "@/src/repositories/categories.service";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialState: Inserts<TableNames.Categories> | Updates<TableNames.Categories> = {
  name: "",
  type: "",
  description: "",
  icon: "",
};

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<CategoryFormType>(initialState);

  const { data: category, isLoading, error } = useGetCategoryById(categoryId);

  useEffect(() => {
    if (categoryId && category) {
      setInitialValues({
        ...category,
      });
    }
  }, [categoryId, category]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <CategoryForm category={initialValues} />;
}
