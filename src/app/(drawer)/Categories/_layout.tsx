import { Stack } from "expo-router";

export default function CategoriesStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Upsert"
        options={({ route }: any) => ({
          title: route.params?.categoryId ? "Edit Category" : "Add Category",
        })}
      />
      <Stack.Screen
        name="Groups/Upsert"
        options={({ route }: any) => ({
          title: route.params?.groupId ? "Edit Group" : "Add Group",
        })}
      />
    </Stack>
  );
}
