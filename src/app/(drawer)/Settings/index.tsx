import { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import Button from "@/src/components/Button";
import MyModal from "@/src/components/MyModal";
import ConfigurationForm, { ConfigurationFormType, initialState } from "@/src/components/forms/ConfigurationForm";
import { useGetConfigurations, useDeleteConfiguration } from "@/src/services/repositories/Configurations.Repository";

export default function Settings() {
  const { data, isLoading, error } = useGetConfigurations();
  const { mutate: deleteConfiguration, isPending: isDeleting } = useDeleteConfiguration();

  const [modalOpen, setModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ConfigurationFormType | undefined>(undefined);

  const handleEdit = (item: ConfigurationFormType) => {
    setEditConfig(item);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditConfig(undefined);
    setModalOpen(true);
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    Alert.alert("Delete Configuration", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteConfiguration(id),
      },
    ]);
  };

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="flex-1 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold">Configurations</Text>
        <Button label="Add" onPress={handleAdd} />
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border-b border-border py-2">
            <View className="flex-1">
              <Text className="font-semibold">
                {item.table} / {item.type}
              </Text>
              <Text>
                {item.key}: {item.value}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable onPress={() => handleEdit(item)}>
                <Text className="text-blue-500 mr-3">Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Text className="text-red-500">{isDeleting ? "Deleting..." : "Delete"}</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No configurations found.</Text>}
      />
      <MyModal isOpen={modalOpen} setIsOpen={setModalOpen}>
        <ConfigurationForm
          configuration={editConfig}
          onSuccess={() => {
            setModalOpen(false);
            setEditConfig(undefined);
          }}
        />
      </MyModal>
    </View>
  );
}
