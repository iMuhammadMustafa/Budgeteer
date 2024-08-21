import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { deleteCategory, useGetList } from "@/src/repositories/api";
import { Link } from "expo-router";
import { Category } from "@/src/lib/supabase";
import { TableData, TableRow } from "@/components/ui/table";
import Icon from "@/src/lib/IonIcons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import List from "@/src/components/List";

export default function Categories() {
  const { data, isLoading, error } = useGetList<Category>("categories");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsActionLoading(false);
    },
    onMutate: () => setIsActionLoading(true),
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={data!}
      columns={["Name", "Type", "Description", "Create Date", "Actions"]}
      createLink={{ pathname: "/Categories/Upsert/[categoryId]", params: { categoryId: "new" } }}
      renderItem={(category: Category) => {
        return (
          <TableRow key={category.id} className="text-center">
            <TableData>{category.name}</TableData>
            <TableData>{category.description}</TableData>
            <TableData>{category.type}</TableData>
            <TableData>{new Date(category.createdat).toLocaleDateString("en-GB")}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Categories/Upsert/${category.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => mutation.mutateAsync(category.id)}>
                  <Icon name="Trash2" size={20} className="text-red-600" />
                </TouchableOpacity>
              )}
            </TableData>
          </TableRow>
        );
      }}
    />
  );
}
