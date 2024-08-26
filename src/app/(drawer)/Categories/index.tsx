import { useState } from "react";
import { Text } from "react-native";
import { Category } from "@/src/lib/supabase";
import List from "@/src/components/List";
import { useDeleteCategory, useGetCategories } from "@/src/repositories/categories.service";

export default function Categories() {
  const { data: categories, isLoading, error } = useGetCategories();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { mutate } = useDeleteCategory();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={categories!}
      columns={["Icon", "Name", "Type", "Description", "Create Date"]}
      properties={["icon", "name", "type", "description", "createdat"]}
      createLinks={["/Categories/Upsert"]}
      actions={{
        editLink: `/Categories/Upsert?categoryId=`,
        onDelete: (item: Category) => {
          setIsActionLoading(true);
          return mutate(item.id, { onSuccess: () => setIsActionLoading(false) });
        },
        isLoading: isActionLoading,
      }}
    />
  );
}
