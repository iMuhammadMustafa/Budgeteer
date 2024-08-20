import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { deleteAccount, useGetList } from "@/src/repositories/api";
import { Link } from "expo-router";
import { Account, Category } from "@/src/lib/supabase";
import { TableData } from "@/components/ui/table";
import Icon from "@/src/lib/IonIcons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import List from "@/src/components/List";

export default function Categories() {
  const { data, isLoading, error } = useGetList<Account>("categories");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsActionLoading(false);
    },
    onMutate: () => setIsActionLoading(true),
  });

  const handleDelete = async (id: string) => {
    await mutation.mutateAsync(id);
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={data}
      columns={["Name", "Type", "Desription", "Created At", "Actions"]}
      createLink="/Categories/Create/null"
      renderItem={(category: Category) => {
        return (
          <>
            <TableData>{category.name}</TableData>
            <TableData>{category.type}</TableData>
            <TableData>{category.description}</TableData>
            <TableData>{new Date(category.createdat).toLocaleDateString("en-GB")}</TableData>
            <TableData className="flex justify-center items-center gap-2">
              <Link href={`/Categories/Create/${category.id}`}>
                <Icon name="Pencil" size={20} className="text-primary-300" />
              </Link>
              {isActionLoading ? (
                <Icon name="Loader" size={20} className="text-primary-300" />
              ) : (
                <TouchableOpacity onPress={() => handleDelete(category.id)}>
                  <Icon name="Trash2" size={20} className="text-red-600" />
                </TouchableOpacity>
              )}
            </TableData>
          </>
        );
      }}
    />
  );
}
