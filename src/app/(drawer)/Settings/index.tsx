import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import Button from "@/src/components/Button";
import MyModal from "@/src/components/MyModal";
import ConfigurationForm from "@/src/components/forms/ConfigurationForm";
import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";
import { useConfigurationService } from "@/src/services/Configurations.Service";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useState } from "react";
import { ConfigurationFormData } from "@/src/types/components/forms.types";

export default function Settings() {
  const {
    data,
    isLoading,
    error,
    isDeleting,
    storageMode,
    setStorageMode,
    isInitializing,
    modalOpen,
    setModalOpen,
    editConfig,
    setEditConfig,
    handleEdit,
    handleAdd,
    handleDelete,
    handleStorageModeChange,
    onFormSuccess,
  } = useSettingsViewModel();

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;
  return (
    <View className="flex-1 p-4">
      <StorageModeSelection
        storageMode={storageMode}
        handleStorageModeChange={handleStorageModeChange}
        isInitializing={isInitializing}
      />

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
        <ConfigurationForm configuration={editConfig} onSuccess={onFormSuccess} />
      </MyModal>
    </View>
  );
}

const StorageModeSelection = ({
  storageMode,
  handleStorageModeChange,
  isInitializing,
}: {
  storageMode: StorageMode;
  handleStorageModeChange: (mode: StorageMode) => void;
  isInitializing: boolean;
}) => {
  return (
    <View className="mb-6 p-4 border border-border rounded-lg bg-background">
      <Text className="text-lg font-bold mb-3">Storage Mode</Text>
      <Text className="text-sm text-foreground/70 mb-3">
        Current: {StorageModeConfig[storageMode].icon} {StorageModeConfig[storageMode].title} -{" "}
        {StorageModeConfig[storageMode].description}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {Object.values(StorageMode).map(mode => (
          <Pressable
            key={mode}
            className={`px-3 py-2 rounded border ${
              storageMode === mode ? "bg-primary border-primary" : "bg-background border-border"
            }`}
            onPress={() => handleStorageModeChange(mode)}
            disabled={isInitializing || storageMode === mode}
          >
            <Text className={`text-sm ${storageMode === mode ? "text-primary-foreground" : "text-foreground"}`}>
              {StorageModeConfig[mode].icon} {StorageModeConfig[mode].title}
            </Text>
          </Pressable>
        ))}
      </View>
      {isInitializing && <Text className="text-sm text-blue-500 mt-2">Switching storage mode...</Text>}
    </View>
  );
};

const useSettingsViewModel = () => {
  const configService = useConfigurationService();
  const { data, isLoading, error } = configService.findAll();
  const { mutate: deleteConfiguration, isPending: isDeleting } = configService.delete();
  const { storageMode, setStorageMode, isInitializing } = useStorageMode();
  const [modalOpen, setModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ConfigurationFormData | undefined>(undefined);

  const handleEdit = (item: ConfigurationFormData) => {
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
        onPress: () => deleteConfiguration({ id }),
      },
    ]);
  };
  const handleStorageModeChange = async (newMode: StorageMode) => {
    try {
      await setStorageMode(newMode);
      Alert.alert("Storage Mode Changed", `Switched to ${newMode} mode successfully!`);
    } catch (error) {
      console.error("Failed to change storage mode:", error);
      Alert.alert("Error", "Failed to change storage mode. Please try again.");
    }
  };
  const onFormSuccess = () => {
    setModalOpen(false);
    setEditConfig(undefined);
  };
  return {
    data,
    isLoading,
    error,
    isDeleting,
    storageMode,
    setStorageMode,
    isInitializing,
    modalOpen,
    setModalOpen,
    editConfig,
    setEditConfig,
    handleEdit,
    handleAdd,
    handleDelete,
    handleStorageModeChange,
    onFormSuccess,
  };
};
