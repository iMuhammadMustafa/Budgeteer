import { useState } from "react";
import { Text } from "react-native";
import { AccountsCategory } from "@/src/lib/supabase";
import List from "@/src/components/List";
import { useGetAccountCategories, useDeleteAccountCategory } from "@/src/repositories/accountcategories.service";

export default function AccountsCategories() {
  const { data, isLoading, error } = useGetAccountCategories();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { mutate } = useDeleteAccountCategory();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <List
      data={data!}
      columns={["Name", "Description", "Created At"]}
      properties={["name", "description", "createdat"]}
      createLinks={["/Accounts/Categories/Upsert"]}
      actions={{
        editLink: "/Accounts/Categories/Upsert?categoryId=",
        onDelete: (item: AccountsCategory) => {
          setIsActionLoading(true);
          return mutate(item.id, { onSuccess: () => setIsActionLoading(false) });
        },
        isLoading: isActionLoading,
      }}
    />
  );
}
